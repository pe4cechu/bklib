'use client';
import React, { useEffect, useRef, useState } from 'react';
import Book from '../components/Book';
import { useBookContext } from '../context/BookContext';
import search from '@/app/public/icons/search.svg';
import { useRouter } from 'next/navigation';

const page = () => {
    const router = useRouter();
    const { books, data, setData } = useBookContext();
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);

    const [searchTerm, setsearchTerm] = useState('');
    const searchBarRef = useRef(null);

    // Borrow modal state
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [borrowForm, setBorrowForm] = useState({
        name: '',
        contact: '',
        startDate: '',
        endDate: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSumbit = (e) => {
        e.preventDefault();
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        router.push(`/search/${encodedSearchTerm}`);
        setsearchTerm('');
    };

    const applyFilters = (category) => {
        let filteredBooks = books ?? [];

        if (category) {
            if (category === 'Others') {
                const known = ['Novel', 'Textbook', 'Comic'];
                filteredBooks = filteredBooks.filter((p) => !known.includes(p.category));
            } else {
                filteredBooks = filteredBooks.filter((p) => p.category === category);
            }
        }

        setData(filteredBooks);
    };

    const filterByCategory = (category) => {
        const newCategory = activeCategory === category ? null : category;
        setActiveCategory(newCategory);
        applyFilters(newCategory);
    };

    const handleBorrow = (book) => {
    };

    const submitBorrowRequest = async (e) => {
        e.preventDefault();
        if (!selectedBook) return;
        setSubmitting(true);
        const payload = {
            bookId: selectedBook.id ?? selectedBook._id ?? null,
            bookTitle: selectedBook.title ?? selectedBook.name,
            ...borrowForm,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        try {
            const res = await fetch('/api/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to send request');
            // Optionally update UI or book availability locally
            setShowBorrowModal(false);
        } catch (err) {
            console.error(err);
            // Optionally show error message
        } finally {
            setSubmitting(false);
        }
    };

    // Close search bar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
                setShowSearchBar(false);
            }
        };

        if (showSearchBar) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchBar]);

    return (
        <div>
            {/* Filter system */}
            <div className="container mx-auto my-8 px-4">
                <div className="bg-white text-black p-6 rounded-xl border border-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <strong className={'font-poppins-extra-bold pr-4'}>Category:</strong>
                            <button onClick={() => filterByCategory('Novel')} className={`px-3 py-1 rounded-full cursor-pointer ${activeCategory === 'Novel' ? 'text-[#0179ca] bg-blue-100' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>Novel</button>
                            <button onClick={() => filterByCategory('Textbook')} className={`px-3 py-1 rounded-full cursor-pointer ${activeCategory === 'Textbook' ? 'text-[#0179ca] bg-blue-100' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>Textbook</button>
                            <button onClick={() => filterByCategory('Comic')} className={`px-3 py-1 rounded-full cursor-pointer ${activeCategory === 'Comic' ? 'text-[#0179ca] bg-blue-100' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>Comic</button>
                            <button onClick={() => filterByCategory('Others')} className={`px-3 py-1 rounded-full cursor-pointer ${activeCategory === 'Others' ? 'text-[#0179ca] bg-blue-100' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>Others</button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                            {!showSearchBar ? (
                                <img src={search.src} alt="Search" className="w-5 h-5 cursor-pointer" onClick={() => setShowSearchBar(true)} />
                            ) : (
                                <form onSubmit={handleSumbit} className="flex" ref={searchBarRef}>
                                    <div className="flex justify-end">
                                        <input value={searchTerm} onChange={(e) => setsearchTerm(e.target.value)} type="text" className="text-black py-2 pl-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" placeholder="Search by title..." />
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pass borrow handler to Book */}
            <Book items={data} onBorrow={handleBorrow} />

            {/* Borrow modal */}
            {showBorrowModal && selectedBook && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-3">Request to borrow "{selectedBook.title ?? selectedBook.name}"</h3>
                        <form onSubmit={submitBorrowRequest} className="space-y-3">
                            <input required value={borrowForm.name} onChange={(e) => setBorrowForm({ ...borrowForm, name: e.target.value })} placeholder="Your name" className="w-full border px-3 py-2 rounded" />
                            <input required value={borrowForm.contact} onChange={(e) => setBorrowForm({ ...borrowForm, contact: e.target.value })} placeholder="Contact (email/phone)" className="w-full border px-3 py-2 rounded" />
                            <div className="grid grid-cols-2 gap-2">
                                <input required type="date" value={borrowForm.startDate} onChange={(e) => setBorrowForm({ ...borrowForm, startDate: e.target.value })} className="w-full border px-3 py-2 rounded" />
                                <input required type="date" value={borrowForm.endDate} onChange={(e) => setBorrowForm({ ...borrowForm, endDate: e.target.value })} className="w-full border px-3 py-2 rounded" />
                            </div>
                            <textarea value={borrowForm.message} onChange={(e) => setBorrowForm({ ...borrowForm, message: e.target.value })} placeholder="Optional message" className="w-full border px-3 py-2 rounded" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowBorrowModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-blue-600 text-white">{submitting ? 'Sending...' : 'Send request'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default page;
