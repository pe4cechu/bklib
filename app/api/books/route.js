import connectDB from '../../utils/database';
import { createBook, getBooks, updateBook, deleteBook } from '../../controllers/book';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
    const isAdmin = user && user.role === 'admin';
    if (!isAdmin) {
        return { error: new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }) };
    }
    return { user };
};

// http://localhost:3001/api/books
export async function POST(req) {
    const { error } = await requireAdmin();
    if (error) return error;
    await connectDB();
    return createBook(req);
}

// http://localhost:3001/api/books
export async function GET(req) {
    await connectDB();
    return getBooks();
}

export async function PUT(req) {
    const { error } = await requireAdmin();
    if (error) return error;
    await connectDB();
    return updateBook(req);
}

export async function DELETE(req) {
    const { error } = await requireAdmin();
    if (error) return error;
    await connectDB();
    return deleteBook(req);
}
