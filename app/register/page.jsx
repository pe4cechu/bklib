// File: `app/register/page.jsx`
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Loader from './../components/Loader';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.studentId) {
            toast.error('Please fill all fields, including student ID.');
            return;
        }
        const emailLower = form.email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+$/.test(emailLower)) {
            toast.error('Please enter a valid email address.');
            return;
        }
        if (!emailLower.endsWith('@hcmut.edu.vn')) {
            toast.error('Email must end with @hcmut.edu.vn.');
            return;
        }
        if (form.password !== form.confirm) {
            toast.error('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    studentId: form.studentId,
                }),
            });
            if (res.ok) {
                toast.success('Registration successful! Please login.');
                router.push('/login');
            } else {
                console.error('Register failed response:', res);
                let data;
                try {
                    data = await res.json();
                } catch {
                    try {
                        const text = await res.text();
                        data = { message: text };
                    } catch {
                        data = {};
                    }
                }
                toast.error(data?.message || `Registration failed (status ${res.status}).`);
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white text-black p-6 rounded-xl border border-gray-300">
                <h1 className="text-2xl font-poppins-bold mb-4">Register</h1>
                <form onSubmit={handleSubmit} className="space-y-3 font-poppins-normal">
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="w-full p-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        type="email"
                        placeholder="Email"
                        pattern="[A-Za-z0-9._%+-]+@hcmut\.edu\.vn"
                        title="Email must end with @hcmut.edu.vn"
                        className="w-full p-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                        name="studentId"
                        value={form.studentId}
                        onChange={handleChange}
                        placeholder="Student ID"
                        className="w-full p-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                        name="confirm"
                        value={form.confirm}
                        onChange={handleChange}
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full p-2 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        aria-busy={loading}
                        className="group relative overflow-hidden w-full p-2 bg-black hover:bg-[#0179ca] text-white font-poppins-bold rounded-xl disabled:opacity-60 flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <Loader />
                                <span>Registering...</span>
                            </>
                        ) : (
                            <>
                                <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                    Register
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    Register
                                </span>
                                <span className="invisible">Register</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}