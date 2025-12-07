// app/profile/page.jsx
'use client';
import React from 'react';
import { useSession } from '@/app/context/SessionProvider';

export default function ProfilePage() {
    const { user, loading } = useSession();

    if (loading) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <div className="bg-white text-black p-6 rounded-xl border border-gray-300">
                    <h1 className="text-2xl font-poppins-bold mb-4">Profile</h1>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <div className="bg-white text-black p-6 rounded-xl border border-gray-300">
                    <h1 className="text-2xl font-poppins-bold mb-4">Profile</h1>
                    <p>Please login to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white text-black p-6 rounded-xl border border-gray-300">
                <h1 className="text-2xl font-poppins-bold mb-4">Profile</h1>
                <div className="space-y-3 font-poppins-normal">
                    <div>
                        <label className="font-poppins-semi-bold">Name</label>
                        <p className="w-full p-2 bg-gray-100 rounded-xl">{user.name}</p>
                    </div>
                    <div>
                        <label className="font-poppins-semi-bold">Email</label>
                        <p className="w-full p-2 bg-gray-100 rounded-xl">{user.email}</p>
                    </div>
                    <div>
                        <label className="font-poppins-semi-bold">Student ID</label>
                        <p className="w-full p-2 bg-gray-100 rounded-xl">{user.studentId || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
