'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useBookContext } from '../context/BookContext';
import { useSession } from '../context/SessionProvider';
import Book from '../components/Book';

const Page = ({ params }) => {
    const { books } = useBookContext();
    const { user, loading: sessionLoading } = useSession();
    const [bookById, setBookById] = useState(null);
    const [relatedBook, setRelatedBook] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Modal / form state
    const [showForm, setShowForm] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [dateReturn, setDateReturn] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const minReturnDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        const fetchBook = async () => {
            const { slug } = await params;
            const filterBook = books.find((p) => p._id === slug);

            if (filterBook) {
                setBookById(filterBook);
                const related = books.filter((p) => p.category === filterBook.category);
                setRelatedBook(related);
            }
        };

        fetchBook();
    }, [params, books]);

    const handleBorrow = () => {
        // Check if book is available
        if (!bookById.available) {
            toast.error('This book is currently unavailable for borrowing.');
            return;
        }
        
        // Open the filling form modal
        setShowForm(true);
        setSuccess(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            if (sessionLoading) {
                setSubmitting(false);
                return;
            }

            if (!user) {
                setError('Please log in to send a borrow request.');
                setSubmitting(false);
                return;
            }

            const chosenDate = new Date(dateReturn);
            const minDate = new Date(minReturnDate);
            if (Number.isNaN(chosenDate.getTime()) || chosenDate < minDate) {
                setError('Return date must be at least 1 day from today.');
                setSubmitting(false);
                return;
            }

            const res = await fetch('/api/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookTitle: bookById.title,
                    quantity: parseInt(quantity),
                    dateReturn,
                    note,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to send request');
            }

            toast.success('Request sent successfully.');
            setShowForm(false);
            setSuccess('Request sent successfully.');
            // optionally clear form
            setQuantity(1);
            setDateReturn('');
            setNote('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!bookById) return <p className="text-center font-poppins-bold text-xl my-5">No books found.</p>;

    return (
        <div className="text-gray-900">
            <div className="container mx-auto my-10">
                <div className="flex flex-col md:flex-row items-start">
                    {/* Book Image */}
                    <div className="md:w-1/2 flex flex-col justify-start items-center p-3">
                        <img
                            src={
                                activeImageIndex === 0
                                    ? bookById.imgSrc
                                    : bookById.other_images[activeImageIndex - 1]
                            }
                            alt="img"
                            className="w-[450px] h-[600px] object-cover rounded-lg"
                        />
                        <div className="flex justify-start items-center mt-4 space-x-2">
                            <img
                                src={bookById.imgSrc}
                                alt="Main"
                                className={`w-16 h-16 object-cover rounded-lg cursor-pointer ${
                                    activeImageIndex === 0 ? 'border-2 border-black' : ''
                                }`}
                                onClick={() => setActiveImageIndex(0)}
                            />
                            {bookById.other_images.map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`Other ${index + 1}`}
                                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer ${
                                        activeImageIndex === index + 1 ? 'border-2 border-black' : ''
                                    }`}
                                    onClick={() => setActiveImageIndex(index + 1)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Book Details */}
                    <div className="md:w-1/2 pt-16">
                        <h1 className="text-5xl font-poppins-bold pb-6">{bookById.title}</h1>
                        <p className="mb-6 text-2xl font-poppins-medium  ">{bookById.category}</p>
                        <div className="mb-6">
                            <span className={`text-2xl font-poppins-bold ${bookById.available ? 'text-[#0179ca]' : 'text-red-500'}`}>
                                {bookById.available ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                        <div className="flex pb-11 space-x-4">
                            <button
                                onClick={handleBorrow}
                                disabled={!bookById.available}
                                className="group relative flex items-center bg-black text-white px-8 py-4 rounded-full font-poppins-bold hover:bg-[#0179ca] transition cursor-pointer overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ minWidth: '185px', minHeight: '42px' }}
                            >
                                <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                    To Borrow
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    To Borrow
                                </span>
                            </button>
                        </div>

                        {/* Book Description */}
                        <div className="mt-8 p-4 border border-gray-300 rounded-lg bg-white">
                            <h2 className="text-xl font-poppins-bold mb-3">Description</h2>
                            <div
                                className="text-gray-700 font-poppins-light text-justify"
                                dangerouslySetInnerHTML={{
                                    __html: bookById.description
                                        .replace(/•/g, '<br />•')
                                        .split('\n')
                                        .map((line) => `<p style="margin-bottom: 1.5rem;">${line}</p>`)
                                        .join(''),
                                }}
                            ></div>
                        </div>

                        {/* Book Details Grid */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-300 rounded-lg bg-white">
                                <h3 className="text-sm font-poppins-bold text-gray-600 mb-1">Author</h3>
                                <p className="text-lg font-poppins-medium">{bookById.author}</p>
                            </div>
                            <div className="p-4 border border-gray-300 rounded-lg bg-white">
                                <h3 className="text-sm font-poppins-bold text-gray-600 mb-1">Publisher</h3>
                                <p className="text-lg font-poppins-medium">{bookById.publisher}</p>
                            </div>
                            <div className="p-4 border border-gray-300 rounded-lg bg-white">
                                <h3 className="text-sm font-poppins-bold text-gray-600 mb-1">Year</h3>
                                <p className="text-lg font-poppins-medium">{bookById.year}</p>
                            </div>
                            <div className="p-4 border border-gray-300 rounded-lg bg-white">
                                <h3 className="text-sm font-poppins-bold text-gray-600 mb-1">Pages</h3>
                                <p className="text-lg font-poppins-medium">{bookById.pages}</p>
                            </div>
                            <div className="p-4 border border-gray-300 rounded-lg bg-white">
                                <h3 className="text-sm font-poppins-bold text-gray-600 mb-1">ISBN</h3>
                                <p className="text-lg font-poppins-medium">{bookById.isbn}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="absolute inset-0 bg-black opacity-40"></div>

                    <div
                        className="relative bg-white rounded-xl p-10 shadow-lg z-10 max-w-md w-full text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-poppins-bold mb-2">Borrow Request</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div>
                                <label className="block text-sm font-poppins-medium mb-1">Quantity</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full border border-gray-400 px-3 py-2 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-poppins-medium mb-1">Return Date</label>
                                <input
                                    required
                                    type="date"
                                    value={dateReturn}
                                    onChange={(e) => setDateReturn(e.target.value)}
                                    min={minReturnDate}
                                    className="w-full border border-gray-400 px-3 py-2 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-poppins-medium mb-1">Note</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-400 px-3 py-2 rounded-md"
                                />
                            </div>

                            <div className="flex items-center justify-end font-poppins-bold space-x-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="group relative overflow-hidden px-4 py-2 pl-4 bg-black text-white rounded-full disabled:opacity-50 hover:bg-[#0179ca] transition duration-300"
                                >
                                    <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                        {submitting ? 'Sending...' : 'Send'}
                                    </span>
                                    <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        {submitting ? 'Sending...' : 'Send'}
                                    </span>
                                    <span className="invisible">{submitting ? 'Sending...' : 'Send'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className="group relative overflow-hidden px-4 py-2 border border-gray-400 rounded-full bg-white text-black hover:bg-[#0179ca] hover:text-white hover:border-[#0179ca] transition duration-300"
                                >
                                    <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                                        Close
                                    </span>
                                    <span className="absolute inset-0 flex items-center justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        Close
                                    </span>
                                    <span className="invisible">Close</span>
                                </button>
                            </div>

                            {success && <p className="text-green-600">{success}</p>}
                            {error && <p className="text-red-600">{error}</p>}
                        </form>
                    </div>
                </div>
            )}

            {/* Related Books */}
            <h1 className="text-center text-2xl font-poppins-extra-bold my-5">
                Related book
            </h1>
            <Book items={relatedBook} />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </div>
    );
};

export default Page;
