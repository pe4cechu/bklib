'use client';
import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api';

// create book context
const BookContext = createContext();

export const BookProvider = ({ children }) => {
    const [books, setBooks] = useState([]);
    const [data, setData] = useState([]);

    const fetchAllBooks = async () => {
        const api = await axios.get(`${API_BASE_URL}/books`);
        setBooks(api.data.book);
        setData(api.data.book);
        console.log('fetched all books = ', books);
    };

    useEffect(() => {
        fetchAllBooks();
    }, []);

    console.log('fetched all books = ', books);

    return (
        <BookContext.Provider
            value={{
                books,
                data,
                setData,
            }}
        >
            {children}
        </BookContext.Provider>
    );
};

// custom Hook for context
export const useBookContext = () => useContext(BookContext);

export default BookContext;
