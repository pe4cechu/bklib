import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/app/utils/database';
import Request from '@/app/models/Request';
import Book from '@/app/models/Book';

const getUserFromCookie = async () => {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('session');
    if (!cookie) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-secret');
        const { payload } = await jwtVerify(cookie.value, secret);
        return payload;
    } catch (err) {
        return null;
    }
};

const requireAdmin = async () => {
    const user = await getUserFromCookie();
    const isAdmin = user && (user.role === 'admin' || user.role === 'manager');
    if (!isAdmin) {
        return { error: new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }) };
    }
    return { user };
};

export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const requests = await Request.find().sort({ createdAt: -1 });
    return new Response(JSON.stringify({ requests }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function PATCH(req) {
    const { error } = await requireAdmin();
    if (error) return error;

    let body;
    try {
        body = await req.json();
    } catch (err) {
        return new Response(JSON.stringify({ message: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { id, status, returnStatus } = body || {};
    
    // Validate status if provided
    if (status && !['pending', 'approved', 'rejected', 'returned'].includes(status)) {
        return new Response(JSON.stringify({ message: 'Invalid status value' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Validate returnStatus if provided
    if (returnStatus && !['borrowed', 'pending_return', 'returned'].includes(returnStatus)) {
        return new Response(JSON.stringify({ message: 'Invalid returnStatus value' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!id || (!status && !returnStatus)) {
        return new Response(JSON.stringify({ message: 'Invalid payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    await connectDB();
    
    // Get the request to check
    const request = await Request.findById(id);
    if (!request) {
        return new Response(JSON.stringify({ message: 'Request not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Handle borrow approval/rejection
    if (status && status !== request.status) {
        // If approving, check if enough books are available
        if (status === 'approved') {
            // Find the book by title
            const book = await Book.findOne({ title: request.bookTitle });
            if (!book) {
                return new Response(JSON.stringify({ message: 'Book not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Calculate how many are already borrowed (approved requests that are not returned)
            const approvedRequests = await Request.find({
                bookTitle: request.bookTitle,
                status: 'approved',
                returnStatus: { $ne: 'returned' },
                _id: { $ne: id } // exclude current request
            });

            const totalBorrowed = approvedRequests.reduce((sum, req) => sum + req.quantity, 0);
            const availableQuantity = book.quantity - totalBorrowed;

            // Check if there's enough quantity available
            if (availableQuantity < request.quantity) {
                return new Response(JSON.stringify({ 
                    message: `Not enough books available. Only ${availableQuantity} copies available, but ${request.quantity} requested.` 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // After approval, check if all copies are now borrowed and update availability
            const newTotalBorrowed = totalBorrowed + request.quantity;
            const isNowUnavailable = newTotalBorrowed >= book.quantity;
            
            if (isNowUnavailable) {
                await Book.findByIdAndUpdate(book._id, { available: false });
            }
        } else if (status === 'rejected' || status === 'pending') {
            // If rejecting or reverting approval, check if book should be marked available again
            const book = await Book.findOne({ title: request.bookTitle });
            if (book && !book.available) {
                // Calculate total borrowed for this book (excluding returned)
                const approvedRequests = await Request.find({
                    bookTitle: request.bookTitle,
                    status: 'approved',
                    returnStatus: { $ne: 'returned' }
                });
                const totalBorrowed = approvedRequests.reduce((sum, req) => sum + req.quantity, 0);
                
                // If there are available copies, mark book as available
                if (totalBorrowed < book.quantity) {
                    await Book.findByIdAndUpdate(book._id, { available: true });
                }
            }
        } else if (status === 'returned') {
            // If marking request as returned, free up the book quantity
            const book = await Book.findOne({ title: request.bookTitle });
            if (book) {
                // Calculate total borrowed for this book (excluding returned and this request)
                const approvedRequests = await Request.find({
                    bookTitle: request.bookTitle,
                    status: 'approved',
                    returnStatus: { $ne: 'returned' },
                    _id: { $ne: id }
                });
                
                const totalBorrowed = approvedRequests.reduce((sum, req) => sum + req.quantity, 0);
                
                // After this return, check if book should be marked as available
                if (totalBorrowed < book.quantity && !book.available) {
                    await Book.findByIdAndUpdate(book._id, { available: true });
                }
            }
        }
    }

    // Handle return status changes
    if (returnStatus && returnStatus !== request.returnStatus) {
        // Only process return for approved or returned requests
        if (request.status === 'approved' || request.status === 'returned') {
            const book = await Book.findOne({ title: request.bookTitle });
            if (!book) {
                return new Response(JSON.stringify({ message: 'Book not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // If marking as returned, recalculate book availability
            if (returnStatus === 'returned') {
                // Calculate total borrowed for this book (excluding this one and already returned)
                const approvedRequests = await Request.find({
                    bookTitle: request.bookTitle,
                    status: 'approved',
                    returnStatus: { $ne: 'returned' },
                    _id: { $ne: id }
                });
                
                const totalBorrowed = approvedRequests.reduce((sum, req) => sum + req.quantity, 0);
                
                // After this return, check if book should be marked as available
                if (totalBorrowed < book.quantity && !book.available) {
                    await Book.findByIdAndUpdate(book._id, { available: true });
                }
            } else if (request.returnStatus === 'returned' && returnStatus !== 'returned') {
                // If reverting a return, recalculate availability
                const approvedRequests = await Request.find({
                    bookTitle: request.bookTitle,
                    status: 'approved',
                    returnStatus: { $ne: 'returned' },
                    _id: { $ne: id }
                });
                
                const totalBorrowed = approvedRequests.reduce((sum, req) => sum + req.quantity, 0);
                const newTotalBorrowed = totalBorrowed + request.quantity;
                
                if (newTotalBorrowed >= book.quantity) {
                    await Book.findByIdAndUpdate(book._id, { available: false });
                }
            }
        }
    }

    // Build update object
    const updateData = {};
    if (status) updateData.status = status;
    if (returnStatus) updateData.returnStatus = returnStatus;

    const updated = await Request.findByIdAndUpdate(id, updateData, { new: true });

    return new Response(JSON.stringify({ request: updated }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
