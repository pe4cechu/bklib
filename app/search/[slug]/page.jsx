'use client';
import React from 'react';
import { useBookContext } from '../../context/BookContext';
import Book from '../../components/Book';

// Function to remove Vietnamese diacritics
const removeVietnameseDiacritics = (str) => {
    return str
        .normalize('NFD') // Decompose diacritics
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritic marks
        .replace(/đ/g, 'd') // Replace đ with d
        .replace(/Đ/g, 'D'); // Replace Đ with D
};

const SearchPage = ({ params }) => {
    const { slug } = React.use(params); // Extract slug from params
    const decodedSlug = slug ? decodeURIComponent(slug) : ''; // Decode the slug
    const { books } = useBookContext();

    // Handle empty or invalid slug
    if (!decodedSlug) {
        return <div>No search term provided</div>;
    }

    const items = books.filter((p) => {
        const normalizedTitle = removeVietnameseDiacritics(p.title.toLowerCase());
        const normalizedSlug = removeVietnameseDiacritics(decodedSlug.toLowerCase());

        return (
            normalizedTitle.includes(normalizedSlug)
        );
    });

    return (
        <div className="py-10">
            <Book items={items} />
        </div>
    );
};

export default SearchPage;
