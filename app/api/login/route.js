// File: `app/api/login/route.js`
import connectDB from '@/app/utils/database';
import User from '@/app/models/User';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req) {
    await connectDB();
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ message: 'Missing fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-secret');
        const alg = 'HS256';

        const jwt = await new SignJWT({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            studentId: user.studentId,
        })
            .setProtectedHeader({ alg })
            .setExpirationTime('24h')
            .sign(secret);

        const cookieStore = await cookies();
        cookieStore.set({
            name: 'session',
            value: jwt,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'bookion',
            sameSite: 'strict',
            path: '/',
        });

        return new Response(JSON.stringify({ message: 'Logged in successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ message: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}