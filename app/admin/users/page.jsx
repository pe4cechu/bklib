'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from '@/app/context/SessionProvider';

const emptyForm = {
    name: '',
    email: '',
    studentId: '',
    role: 'user',
    password: '',
};

const AdminUsersPage = () => {
    const { user, loading } = useSession();
    const isAdmin = user?.role === 'admin' || user?.privilege === 'admin';

    // Only admins can manage users, not managers
    if (!loading && !isAdmin) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                    <h1 className="text-2xl font-poppins-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600">Only administrators can manage users.</p>
                </div>
            </div>
        );
    }

    const [users, setUsers] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
    const [search, setSearch] = useState('');

    const loadUsers = async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Failed to load users');
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && isAdmin) {
            loadUsers();
        }
    }, [loading, isAdmin]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditing(user);
        setForm({
            name: user.name || '',
            email: user.email || '',
            studentId: user.studentId?.toString() || '',
            role: user.role || 'user',
            password: '', // Don't populate password for security
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return users;
        return users.filter((user) => {
            return (
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.studentId?.toString().includes(term) ||
                user.role?.toLowerCase().includes(term)
            );
        });
    }, [users, search]);

    const sortedUsers = useMemo(() => {
        const dir = sortBy.dir === 'asc' ? 1 : -1;
        return [...filteredUsers].sort((a, b) => {
            const key = sortBy.key;
            if (key === 'studentId') {
                return ((Number(a[key]) || 0) - (Number(b[key]) || 0)) * dir;
            }
            const av = (a[key] || '').toString().toLowerCase();
            const bv = (b[key] || '').toString().toLowerCase();
            return av.localeCompare(bv) * dir;
        });
    }, [filteredUsers, sortBy]);

    const toggleSort = (key) => {
        setSortBy((prev) => {
            if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            return { key, dir: 'asc' };
        });
    };

    const buildPayload = () => {
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            studentId: Number(form.studentId),
            role: form.role,
        };
        
        // Only include password if it's provided (for create or password update)
        if (form.password.trim()) {
            payload.password = form.password.trim();
        }
        
        return payload;
    };

    const saveUser = async (e) => {
        e.preventDefault();
        
        // Validate password for new users
        if (!editing && !form.password.trim()) {
            toast.error('Password is required for new users');
            return;
        }
        
        setSaving(true);
        try {
            const payload = buildPayload();
            const method = editing ? 'PUT' : 'POST';
            const body = editing ? { id: editing._id, ...payload } : payload;
            const res = await fetch('/api/admin/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Failed to save user');
            }
            const data = await res.json();
            if (editing) {
                setUsers((prev) => prev.map((u) => (u._id === editing._id ? data.user : u)));
                toast.success('User updated');
            } else {
                setUsers((prev) => [data.user, ...prev]);
                toast.success('User added');
            }
            setShowModal(false);
        } catch (err) {
            toast.error(err.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const deleteUser = async (id) => {
        toast(
            ({ closeToast }) => (
                <div className="flex flex-col gap-3">
                    <p className="font-semibold">Are you sure you want to delete this user?</p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={async () => {
                                closeToast();
                                setDeletingId(id);
                                try {
                                    const res = await fetch('/api/admin/users', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id }),
                                    });
                                    if (!res.ok) {
                                        const errText = await res.text();
                                        throw new Error(errText || 'Failed to delete');
                                    }
                                    setUsers((prev) => prev.filter((u) => u._id !== id));
                                    toast.success('User deleted');
                                } catch (err) {
                                    toast.error(err.message || 'Failed to delete');
                                } finally {
                                    setDeletingId(null);
                                }
                            }}
                            className="px-3 py-1 rounded-full text-sm font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                            Delete
                        </button>
                        <button
                            onClick={closeToast}
                            className="px-3 py-1 rounded-full text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            {
                autoClose: false,
                closeButton: false,
            }
        );
    };

    return (
        <div className="container mx-auto px-4 py-6 space-y-4">
            <ToastContainer position="top-center" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-poppins-bold">Manage Users</h1>
                    <p className="text-sm text-gray-600 mt-1">Add, edit, or remove users from the system.</p>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2">
                    <div className="flex items-center justify-end font-poppins-bold space-x-2">
                        <button
                            type="button"
                            onClick={openCreate}
                            className="group relative overflow-hidden px-4 py-2 mr-10 bg-black text-white rounded-full hover:bg-[#0179ca] transition duration-300"
                        >
                            <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                Add user
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                Add user
                            </span>
                            <span className="invisible">Add user</span>
                        </button>
                    </div>
                    <div className="relative w-full md:w-72">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, student ID..."
                            className="w-full px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0179ca]"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5">
                {error && <p className="text-red-600 mb-3">{error}</p>}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-center text-gray-700 font-poppins-bold border-b-2 border-gray-300">
                            <tr className="align-middle">
                                <th className="py-3 px-2 w-44 text-center align-middle cursor-pointer" onClick={() => toggleSort('name')}>
                                    Name {sortBy.key === 'name' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-52 text-center align-middle cursor-pointer" onClick={() => toggleSort('email')}>
                                    Email {sortBy.key === 'email' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-32 text-center align-middle cursor-pointer" onClick={() => toggleSort('studentId')}>
                                    Student ID {sortBy.key === 'studentId' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-28 text-center align-middle cursor-pointer" onClick={() => toggleSort('role')}>
                                    Role {sortBy.key === 'role' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-32 text-center align-middle">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-500">No users found.</td>
                                </tr>
                            )}
                            {sortedUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="py-3 px-3 text-left">
                                        <div className="font-poppins-semibold text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="py-3 px-3 text-left">{user.email}</td>
                                    <td className="py-3 px-2 text-center">{user.studentId}</td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                            user.role === 'admin' 
                                                ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                                : user.role === 'manager'
                                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                        }`}>
                                            {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'User'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 space-x-2 whitespace-nowrap text-center">
                                        <button onClick={() => openEdit(user)} className="px-3 py-1 rounded-full text-xs font-semibold border text-blue-700 hover:bg-[#0179ca]">Edit</button>
                                        <button onClick={() => deleteUser(user._id)} disabled={deletingId === user._id} className="px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40">
                                            {deletingId === user._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-poppins-bold">{editing ? 'Edit user' : 'Add user'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={saveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="border border-gray-300 px-3 py-2 rounded-xl md:col-span-2" required />
                            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" className="border border-gray-300 px-3 py-2 rounded-xl md:col-span-2" required />
                            <input name="studentId" value={form.studentId} onChange={handleChange} placeholder="Student ID" type="number" className="border border-gray-300 px-3 py-2 rounded-xl" required />
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-700">Role:</label>
                                <select name="role" value={form.role} onChange={handleChange} className="flex-1 border border-gray-300 px-3 py-2 rounded-xl">
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <input 
                                name="password" 
                                value={form.password} 
                                onChange={handleChange} 
                                placeholder={editing ? "New Password (leave empty to keep current)" : "Password"} 
                                type="password" 
                                className="border border-gray-300 px-3 py-2 rounded-xl md:col-span-2" 
                                required={!editing}
                            />
                            {editing && (
                                <p className="text-xs text-gray-500 md:col-span-2 -mt-2">Leave password empty to keep the current password</p>
                            )}
                            <div className="md:col-span-2 flex font-poppins-bold justify-end gap-3 mt-2">
                                <button type="submit" disabled={saving} className="group relative overflow-hidden px-4 py-2 bg-black text-white rounded-full hover:bg-[#0179ca] transition duration-300 disabled:opacity-50">
                                    <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                        {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                                    </span>
                                    <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                                    </span>
                                    <span className="invisible">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</span>
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="group relative overflow-hidden px-4 py-2 border border-gray-400 rounded-full bg-white text-black hover:bg-[#0179ca] hover:text-white hover:border-[#0179ca] transition duration-300">
                                    <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                        Cancel
                                    </span>
                                    <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        Cancel
                                    </span>
                                    <span className="invisible">Cancel</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
