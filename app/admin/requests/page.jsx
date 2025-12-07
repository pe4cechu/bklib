'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from '@/app/context/SessionProvider';

const statusStyles = {
    pending: { label: 'Pending', chip: 'bg-amber-50 border-amber-200 text-amber-800' },
    approved: { label: 'Approved', chip: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    rejected: { label: 'Rejected', chip: 'bg-rose-50 border-rose-200 text-rose-800' },
    returned: { label: 'Returned', chip: 'bg-blue-50 border-blue-200 text-blue-800' },
};

const returnStatusStyles = {
    borrowed: { label: 'Borrowed', chip: 'bg-purple-50 border-purple-200 text-purple-800' },
    pending_return: { label: 'Pending Return', chip: 'bg-orange-50 border-orange-200 text-orange-800' },
    returned: { label: 'Returned', chip: 'bg-blue-50 border-blue-200 text-blue-800' },
};

const AdminRequestsPage = () => {
    const { user, loading } = useSession();
    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
    const [requests, setRequests] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState({ key: 'createdAt', dir: 'desc' });

    const loadRequests = async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/requests');
            if (!res.ok) throw new Error('Failed to load requests');
            const data = await res.json();
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && isAdminOrManager) {
            loadRequests();
        }
    }, [loading, isAdminOrManager]);

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update status');
            }
            
            const data = await res.json();
            setRequests((prev) => prev.map((r) => (r._id === id ? data.request : r)));
            
            // Sync book availability to database when request is approved or rejected
            try {
                const updatedRequest = data.request;
                const booksRes = await fetch('/api/books');
                if (booksRes.ok) {
                    const booksData = await booksRes.json();
                    const books = booksData.book || [];
                    
                    // Fetch all requests to recalculate borrowed quantities
                    const allRequestsRes = await fetch('/api/admin/requests');
                    const allRequestsData = await allRequestsRes.json();
                    const allRequests = allRequestsData.requests || [];
                    
                    // Calculate borrowed quantities
                    const borrowedMap = {};
                    allRequests.forEach((req) => {
                        if (req.status === 'approved') {
                            borrowedMap[req.bookTitle] = (borrowedMap[req.bookTitle] || 0) + req.quantity;
                        }
                    });
                    
                    // Find the book that was in the updated request and update its availability
                    const book = books.find((b) => b.title === updatedRequest.bookTitle);
                    if (book) {
                        const borrowed = borrowedMap[book.title] || 0;
                        const available = borrowed < book.quantity;
                        
                        // Only update if availability changed
                        if (available !== book.available) {
                            await fetch('/api/books', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id: book._id,
                                    available: available,
                                }),
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to sync book availability:', err);
            }
            
            toast.success(`Request ${status}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return requests
            .filter((r) => (filter === 'all' ? true : r.status === filter))
            .filter((r) => {
                if (!term) return true;
                return (
                    r.bookTitle?.toLowerCase().includes(term) ||
                    r.name?.toLowerCase().includes(term) ||
                    r.note?.toLowerCase().includes(term)
                );
            });
    }, [requests, filter, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const dir = sortBy.dir === 'asc' ? 1 : -1;
            if (sortBy.key === 'dateReturn' || sortBy.key === 'createdAt') {
                const av = new Date(a[sortBy.key] || a.createdAt || 0).getTime();
                const bv = new Date(b[sortBy.key] || b.createdAt || 0).getTime();
                return (av - bv) * dir;
            }
            if (sortBy.key === 'quantity') {
                return ((a.quantity || 0) - (b.quantity || 0)) * dir;
            }
            const av = (a[sortBy.key] || '').toString().toLowerCase();
            const bv = (b[sortBy.key] || '').toString().toLowerCase();
            return av.localeCompare(bv) * dir;
        });
    }, [filtered, sortBy]);

    const toggleSort = (key) => {
        setSortBy((prev) => {
            if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            return { key, dir: 'asc' };
        });
    };

    const summary = useMemo(() => {
        const counts = { all: requests.length, pending: 0, approved: 0, rejected: 0, returned: 0 };
        requests.forEach((r) => {
            counts[r.status] = (counts[r.status] || 0) + 1;
        });
        return counts;
    }, [requests]); 

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) return <p className="text-center py-10">Unauthorized</p>;

    return (
        <div className="container mx-auto px-4 py-10 space-y-6">
            <ToastContainer position="top-center" />
            <div className="bg-gradient-to-r from-[#0179ca] to-[#00a7d9] text-white rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-poppins-bold">Borrow Requests</h1>
                        <p className="text-sm mt-1 opacity-90">Review, filter, and act on borrower requests in one place.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, book, note"
                            className="w-full pl-3 pr-10 py-2 rounded-full border border-white/40 bg-white/15 text-white placeholder-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-white/70"
                        />
                        <span className="absolute right-3 top-2.5 text-white/80 text-sm"></span>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['returned', 'Returned']].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            className={`rounded-xl px-4 py-3 bg-white/15 border border-white/20 backdrop-blur text-white flex justify-between items-center transition cursor-pointer ${
                                filter === key ? 'ring-2 ring-white' : 'hover:ring-2 hover:ring-white/60'
                            }`}
                        >
                            <span className="font-poppins-medium">{label}</span>
                            <span className="text-lg font-poppins-bold">{summary[key]}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5 space-y-4">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-center text-gray-700 font-poppins-bold border-b-2 border-gray-300">
                            <tr>
                                <th className="py-3 px-3 w-44 text-center cursor-pointer" onClick={() => toggleSort('bookTitle')}>
                                    Book {sortBy.key === 'bookTitle' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-3 cursor-pointer" onClick={() => toggleSort('name')}>
                                    Borrower {sortBy.key === 'name' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-3 cursor-pointer" onClick={() => toggleSort('quantity')}>
                                    Qty {sortBy.key === 'quantity' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-3 cursor-pointer" onClick={() => toggleSort('dateReturn')}>
                                    Return {sortBy.key === 'dateReturn' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-3 w-80 text-center">Note</th>
                                <th className="py-3 px-3 cursor-pointer" onClick={() => toggleSort('status')}>
                                    Status {sortBy.key === 'status' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-6 text-gray-500">No requests found.</td>
                                </tr>
                            )}
                            {sorted.map((req) => (
                                <tr key={req._id} className="hover:bg-gray-50 transition">
                                    <td className="py-3 px-3 w-44">
                                        <div className="font-poppins-semibold text-gray-900">{req.bookTitle}</div>
                                        <div className="text-xs text-gray-500">{req._id}</div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="font-poppins-medium text-gray-900">{req.name}</div>
                                    </td>
                                    <td className="py-3 px-3 text-center">{req.quantity}</td>
                                    <td className="py-3 px-3 text-center">{new Date(req.dateReturn).toLocaleDateString()}</td>
                                    <td className="py-3 px-3 w-80 max-w-xl">
                                        <div className="text-gray-700 line-clamp-2">{req.note || '—'}</div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                statusStyles[req.status]?.chip || 'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                        >
                                            {statusStyles[req.status]?.label || req.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                        <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => updateStatus(req._id, 'approved')}
                                            disabled={req.status === 'approved' || req.status === 'returned'}
                                            className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => updateStatus(req._id, 'rejected')}
                                            disabled={req.status === 'rejected' || req.status === 'returned'}
                                            className="px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => updateStatus(req._id, 'returned')}
                                            disabled={req.status === 'returned' || req.status !== 'approved'}
                                            className="px-3 py-1 rounded-full text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-40"
                                        >
                                            Return
                                        </button>
                                        </div>
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

export default AdminRequestsPage;
