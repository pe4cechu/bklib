'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/app/context/SessionProvider';

const statusStyles = {
    pending: 'bg-amber-50 border-amber-200 text-amber-800',
    approved: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    rejected: 'bg-rose-50 border-rose-200 text-rose-800',
};

const RequestsPage = () => {
    const { user, loading } = useSession();
    const [requests, setRequests] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setFetching(true);
            setError(null);
            try {
                const res = await fetch('/api/user/requests');
                if (!res.ok) throw new Error('Failed to load requests');
                const data = await res.json();
                setRequests(data.requests || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setFetching(false);
            }
        };
        if (!loading && user) load();
    }, [loading, user]);

    const currentBorrowed = useMemo(
        () => requests.filter((r) => r.status === 'approved'),
        [requests]
    );

    return (
        <div className="container mx-auto px-4 py-10 space-y-6">
            <div>
                <h1 className="text-3xl font-poppins-bold">My Requests</h1>
                <p className="text-sm text-gray-600 mt-1">View your borrow requests and return dates.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-poppins-bold">Currently borrowed</h2>
                    <span className="text-sm text-gray-500">Approved requests</span>
                </div>
                {currentBorrowed.length === 0 ? (
                    <p className="text-gray-500 text-sm">No approved borrow requests yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentBorrowed.map((req) => (
                            <div key={req._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                <div className="font-poppins-semibold text-gray-900">{req.bookTitle}</div>
                                <div className="text-sm text-gray-600 mt-1">Qty: {req.quantity}</div>
                                <div className="text-sm text-gray-700 mt-2">Return date: {new Date(req.dateReturn).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-poppins-bold">All requests</h2>
                    {error && <span className="text-sm text-red-600">{error}</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-700 font-poppins-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3 px-3">Book</th>
                                <th className="py-3 px-3 text-center">Qty</th>
                                <th className="py-3 px-3 text-center">Return date</th>
                                <th className="py-3 px-3">Note</th>
                                <th className="py-3 px-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-500">No requests found.</td>
                                </tr>
                            )}
                            {requests.map((req) => (
                                <tr key={req._id} className="hover:bg-gray-50">
                                    <td className="py-3 px-3">
                                        <div className="font-poppins-semibold text-gray-900">{req.bookTitle}</div>
                                        <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="py-3 px-3 text-center">{req.quantity}</td>
                                    <td className="py-3 px-3 text-center">{new Date(req.dateReturn).toLocaleDateString()}</td>
                                    <td className="py-3 px-3 max-w-xs">
                                        <div className="text-gray-700 line-clamp-2">{req.note || '—'}</div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[req.status] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RequestsPage;
