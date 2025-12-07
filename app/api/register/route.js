import connectDB from '@/app/utils/database';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    await connectDB();
    try {
        const body = await req.json();
        const { name, email, password, studentId, adminToken } = body;

        if (!name || !email || !password || !studentId) {
            return new Response(JSON.stringify({ message: 'Missing fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
        if (existingUser) {
            return new Response(JSON.stringify({ message: 'User already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const role = adminToken && adminToken === process.env.ADMIN_SETUP_TOKEN ? 'admin' : 'user';

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            studentId,
            role,
        });

        await newUser.save();

        return new Response(JSON.stringify({ message: 'Registered successfully' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ message: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
