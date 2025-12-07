import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('session');
    if (!cookie) {
        return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-secret');
        const { payload } = await jwtVerify(cookie.value, secret);

        return new Response(JSON.stringify({ user: payload }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
