export const runtime = 'nodejs'; // ensure Node runtime (Mongoose won't work in Edge)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '../../utils/database';
import Request from '../../models/Request';

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

export async function POST(request) {
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

        const { bookTitle, quantity, dateReturn, note } = body || {};
        if (!bookTitle || !quantity || !dateReturn) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const parsedQuantity = Number(quantity);
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
            return NextResponse.json({ message: 'Quantity must be a positive integer' }, { status: 400 });
        }

        await connectDB();

        const doc = await Request.create({
            userId: user.id || user._id,
            userEmail: user.email,
            name: user.name,
            bookTitle,
            quantity: parsedQuantity,
            dateReturn,
            note,
        });
        return NextResponse.json({ message: 'Saved to MongoDB', id: doc._id }, { status: 200 });
    } catch (err) {
        console.error('borrow POST error:', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
