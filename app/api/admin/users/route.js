import { NextResponse } from 'next/server';
import connectDB from '@/app/utils/database';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET(request) {
    try {
        await connectDB();
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST create new user
export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { name, email, studentId, role, password } = body;

        // Validate required fields
        if (!name || !email || !studentId || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email or student ID already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            name,
            email,
            studentId: Number(studentId),
            role: role || 'user',
            password: hashedPassword,
        });

        // Return user without password
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({ user: userResponse }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}

// PUT update user
export async function PUT(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { id, name, email, studentId, role, password } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (studentId) updateData.studentId = Number(studentId);
        if (role) updateData.role = role;

        // Only hash and update password if provided
        if (password && password.trim()) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Check for duplicate email or studentId (excluding current user)
        if (email || studentId) {
            const duplicateQuery = { _id: { $ne: id } };
            const orConditions = [];
            if (email) orConditions.push({ email });
            if (studentId) orConditions.push({ studentId: Number(studentId) });
            duplicateQuery.$or = orConditions;

            const duplicate = await User.findOne(duplicateQuery);
            if (duplicate) {
                return NextResponse.json({ error: 'User with this email or student ID already exists' }, { status: 400 });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
