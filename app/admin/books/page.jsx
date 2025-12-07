'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useSession } from '@/app/context/SessionProvider';

const emptyForm = {
    title: '',
    category: '',
    author: '',
    imgSrc: '',
    available: 'true',
    description: '',
    other_images: '',
    year: '',
    isbn: '',
    pages: '',
    publisher: '',
    quantity: '',
};

const AdminBooksPage = () => {
    const { user, loading } = useSession();
    const isAdmin = user?.role === 'admin' || user?.privilege === 'admin';

    const [books, setBooks] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [sortBy, setSortBy] = useState({ key: 'title', dir: 'asc' });

    const loadBooks = async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await fetch('/api/books');
            if (!res.ok) throw new Error('Failed to load books');
            const data = await res.json();
            setBooks(data.book || []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && isAdmin) {
            loadBooks();
        }
    }, [loading, isAdmin]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (book) => {
        setEditing(book);
        setForm({
            title: book.title || '',
            category: book.category || '',
            author: book.author || '',
            imgSrc: book.imgSrc || '',
            available: book.available ? 'true' : 'false',
            description: book.description || '',
            other_images: (book.other_images || []).join(', '),
            year: book.year || '',
            isbn: book.isbn || '',
            pages: book.pages?.toString() || '',
            publisher: book.publisher || '',
            quantity: book.quantity?.toString() || '',
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const sortedBooks = useMemo(() => {
        const dir = sortBy.dir === 'asc' ? 1 : -1;
        return [...books].sort((a, b) => {
            const key = sortBy.key;
            if (key === 'quantity' || key === 'pages') {
                return ((Number(a[key]) || 0) - (Number(b[key]) || 0)) * dir;
            }
            if (key === 'available') {
                return ((a.available ? 1 : 0) - (b.available ? 1 : 0)) * dir;
            }
            const av = (a[key] || '').toString().toLowerCase();
            const bv = (b[key] || '').toString().toLowerCase();
            return av.localeCompare(bv) * dir;
        });
    }, [books, sortBy]);

    const toggleSort = (key) => {
        setSortBy((prev) => {
            if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            return { key, dir: 'asc' };
        });
    };

    const buildPayload = () => {
        const images = typeof form.other_images === 'string'
            ? form.other_images.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
        return {
            title: form.title.trim(),
            category: form.category.trim(),
            author: form.author.trim(),
            imgSrc: form.imgSrc.trim(),
            available: form.available === 'true',
            description: form.description.trim(),
            other_images: images,
            year: form.year.trim(),
            isbn: form.isbn.trim(),
            pages: Number(form.pages) || 0,
            publisher: form.publisher.trim(),
            quantity: Number(form.quantity) || 0,
        };
    };

    const saveBook = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = buildPayload();
            const method = editing ? 'PUT' : 'POST';
            const body = editing ? { id: editing._id, ...payload } : payload;
            const res = await fetch('/api/books', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Failed to save book');
            }
            const data = await res.json();
            if (editing) {
                setBooks((prev) => prev.map((b) => (b._id === editing._id ? data.book : b)));
                toast.success('Book updated');
            } else {
                setBooks((prev) => [data.newBook, ...prev]);
                toast.success('Book added');
            }
            setShowModal(false);
        } catch (err) {
            toast.error(err.message || 'Failed to save book');
        } finally {
            setSaving(false);
        }
    };

    const deleteBook = async (id) => {
        if (!confirm('Delete this book?')) return;
        setDeletingId(id);
        try {
            const res = await fetch('/api/books', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Failed to delete');
            }
            setBooks((prev) => prev.filter((b) => b._id !== id));
            toast.success('Book deleted');
        } catch (err) {
            toast.error(err.message || 'Failed to delete');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading || fetching) return <p className="text-center py-10">Loading...</p>;
    if (!isAdmin) return <p className="text-center py-10">Unauthorized</p>;

    return (
        <div className="container mx-auto px-4 py-10 space-y-6">
            <ToastContainer />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-poppins-bold">Manage Books</h1>
                    <p className="text-sm text-gray-600 mt-1">Add, edit, or remove books from the catalog.</p>
                </div>
                <div className="flex items-center justify-end font-poppins-bold space-x-2">
                    <button
                        type="button"
                        onClick={openCreate}
                        className="group relative overflow-hidden px-4 py-2 pl-4 bg-black text-white rounded-full hover:bg-[#0179ca] transition duration-300"
                    >
                        <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                            Add book
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            Add book
                        </span>
                        <span className="invisible">Add book</span>
                    </button>

                    <button
                        type="button"
                        onClick={loadBooks}
                        disabled={fetching}
                        className="group relative overflow-hidden px-4 py-2 border border-gray-400 rounded-full bg-white text-black hover:bg-[#0179ca] hover:text-white hover:border-[#0179ca] transition duration-300 disabled:opacity-50"
                    >
                        <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                            {fetching ? 'Refreshing...' : 'Refresh'}
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            {fetching ? 'Refreshing...' : 'Refresh'}
                        </span>
                        <span className="invisible">{fetching ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5">
                {error && <p className="text-red-600 mb-3">{error}</p>}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-center text-gray-700 font-poppins-bold border-b-2 border-gray-300">
                            <tr className="align-middle">
                                <th className="py-3 px-2 w-44 text-center align-middle cursor-pointer" onClick={() => toggleSort('title')}>
                                    Title {sortBy.key === 'title' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-40 text-center align-middle cursor-pointer" onClick={() => toggleSort('author')}>
                                    Author {sortBy.key === 'author' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-36 text-center align-middle cursor-pointer" onClick={() => toggleSort('category')}>
                                    Category {sortBy.key === 'category' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-24 text-center align-middle cursor-pointer" onClick={() => toggleSort('year')}>
                                    Year {sortBy.key === 'year' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-28 text-center align-middle cursor-pointer" onClick={() => toggleSort('available')}>
                                    Available {sortBy.key === 'available' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-20 text-center align-middle cursor-pointer" onClick={() => toggleSort('quantity')}>
                                    Qty {sortBy.key === 'quantity' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-2 w-32 text-center align-middle">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {books.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-6 text-gray-500">No books found.</td>
                                </tr>
                            )}
                            {sortedBooks.map((book) => (
                                <tr key={book._id} className="hover:bg-gray-50">
                                    <td className="py-3 px-3 text-left">
                                        <div className="font-poppins-semibold text-gray-900">{book.title}</div>
                                        <div className="text-xs text-gray-500">{book.isbn}</div>
                                    </td>
                                    <td className="py-3 px-3 text-left">{book.author}</td>
                                    <td className="py-3 px-2 text-center">{book.category}</td>
                                    <td className="py-3 px-2 text-center">{book.year}</td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${book.available ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                            {book.available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-center">{book.quantity}</td>
                                    <td className="py-3 px-2 space-x-2 whitespace-nowrap text-center">
                                        <button onClick={() => openEdit(book)} className="px-3 py-1 rounded-full text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">Edit</button>
                                        <button onClick={() => deleteBook(book._id)} disabled={deletingId === book._id} className="px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40">
                                            {deletingId === book._id ? 'Deleting...' : 'Delete'}
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
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-poppins-bold">{editing ? 'Edit book' : 'Add book'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={saveBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border px-3 py-2 rounded" required />
                            <input name="author" value={form.author} onChange={handleChange} placeholder="Author" className="border px-3 py-2 rounded" required />
                            <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="border px-3 py-2 rounded" required />
                            <input name="year" value={form.year} onChange={handleChange} placeholder="Year" className="border px-3 py-2 rounded" required />
                            <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="ISBN" className="border px-3 py-2 rounded" required />
                            <input name="publisher" value={form.publisher} onChange={handleChange} placeholder="Publisher" className="border px-3 py-2 rounded" required />
                            <input name="pages" value={form.pages} onChange={handleChange} placeholder="Pages" type="number" className="border px-3 py-2 rounded" required />
                            <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" type="number" className="border px-3 py-2 rounded" required />
                            <input name="imgSrc" value={form.imgSrc} onChange={handleChange} placeholder="Main image URL" className="border px-3 py-2 rounded md:col-span-2" required />
                            <input name="other_images" value={form.other_images} onChange={handleChange} placeholder="Other image URLs (comma separated)" className="border px-3 py-2 rounded md:col-span-2" />
                            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border px-3 py-2 rounded md:col-span-2" rows={3} required />
                            <div className="md:col-span-2 flex items-center gap-3">
                                <label className="text-sm text-gray-700">Availability:</label>
                                <select name="available" value={form.available} onChange={handleChange} className="border px-3 py-2 rounded">
                                    <option value="true">Available</option>
                                    <option value="false">Unavailable</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded border border-gray-300 text-gray-700">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBooksPage;
