import Book from '../models/Book';
import { NextResponse } from 'next/server';

// add book
export const createBook = async (req) => {
    const body = await req.json();

    const newBook = await Book.create(body);

    return NextResponse.json({
        message: 'Book Added SuccessFully...!',
        newBook,
    });
};

// get all books
export const getBooks = async (req) => {
    const book = await Book.find();
    return NextResponse.json({
        message: 'All Book Fetched...!',
        success: true,
        book,
    });
};

// update book
export const updateBook = async (req) => {
    let body;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const { id, ...updates } = body || {};
    if (!id) {
        return NextResponse.json({ message: 'Book id is required' }, { status: 400 });
    }

    const updated = await Book.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
        return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Book updated successfully', book: updated });
};

// delete book
export const deleteBook = async (req) => {
    let body;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const { id } = body || {};
    if (!id) {
        return NextResponse.json({ message: 'Book id is required' }, { status: 400 });
    }

    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) {
        return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Book deleted successfully', book: deleted });
};
