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

const requireAdmin = async () => {
    const user = await getUserFromCookie();
    const isAdmin = user && (user.role === 'admin');
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

    const { id, status } = body || {};
    if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
        return new Response(JSON.stringify({ message: 'Invalid payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    await connectDB();
    const updated = await Request.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
        return new Response(JSON.stringify({ message: 'Request not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ request: updated }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
