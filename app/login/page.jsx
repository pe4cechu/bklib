// File: `app/login/page.jsx`
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from './../components/Loader';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error('Please fill all fields.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            if (res.ok) {
                toast.success('Login successful!');
                router.push('/');
            } else {
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
                toast.error(data?.message || `Login failed (status ${res.status}).`);
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <ToastContainer position="top-center" />
            <div className="bg-white text-black p-6 rounded-xl border border-gray-300">
                <h1 className="text-2xl font-poppins-bold mb-4">Login</h1>
                <form onSubmit={handleSubmit} className="space-y-3 font-poppins-normal">
                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        type="email"
                        placeholder="Email"
                        className="w-full p-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                        required
                    />
                    <input
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                        required
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
                                <span>Logging...</span>
                            </>
                        ) : (
                            <>
                                <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                    Login
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    Login
                                </span>
                                <span className="invisible">Login</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}