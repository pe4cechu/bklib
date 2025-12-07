import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/app/utils/database';
import Request from '@/app/models/Request';

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

export async function GET() {
    const user = await getUserFromCookie();
    if (!user) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    await connectDB();
    const filter = user._id
        ? { $or: [{ userId: user._id }, { name: user.name }] }
        : { name: user.name };
    const requests = await Request.find(filter).sort({ createdAt: -1 });
    return new Response(JSON.stringify({ requests }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
