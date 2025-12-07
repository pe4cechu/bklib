export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/app/utils/database';
import Request from '@/app/models/Request';

const getUserFromCookie = async () => {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (!session) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-secret');
        const { payload } = await jwtVerify(session.value, secret);
        return payload;
    } catch (err) {
        return null;
    }
};

export async function PATCH(request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const user = await getUserFromCookie();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { requestId } = body || {};
        if (!requestId) {
            return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
        }

        await connectDB();

        // Find the request
        const borrowRequest = await Request.findById(requestId);
        if (!borrowRequest) {
            return NextResponse.json({ message: 'Request not found' }, { status: 404 });
        }

        // Verify the request belongs to the user
        const userId = user.id || user._id;
        if (borrowRequest.userId !== userId.toString()) {
            return NextResponse.json({ message: 'Unauthorized to modify this request' }, { status: 403 });
        }

        // Verify the request is approved and not already returned
        if (borrowRequest.status !== 'approved') {
            return NextResponse.json({ message: 'Can only request return for approved requests' }, { status: 400 });
        }

        if (borrowRequest.returnStatus === 'returned') {
            return NextResponse.json({ message: 'This book has already been returned' }, { status: 400 });
        }

        if (borrowRequest.returnStatus === 'pending_return') {
            return NextResponse.json({ message: 'Return request already pending' }, { status: 400 });
        }

        // Update the return status to pending_return
        const updated = await Request.findByIdAndUpdate(
            requestId, 
            { returnStatus: 'pending_return' }, 
            { new: true }
        );

        return NextResponse.json({ 
            message: 'Return request submitted successfully', 
            request: updated 
        }, { status: 200 });

    } catch (err) {
        console.error('return request PATCH error:', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
