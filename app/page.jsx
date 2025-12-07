'use client';
import React from 'react';
import banner from './public/images/banner.jpg';

const LibraryBanner = () => {
    return (
        <div className="relative z-10">
            <img className="h-96 w-full object-cover" src={banner.src} alt="Library Banner" />
            <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <h1 className="text-white text-6xl font-poppins-extra-bold">LIBRARY RULES</h1>
            </div>
        </div>
    );
};

const LibraryRules = () => {
    const rules = [
        {
            title: 'Borrowing Books',
            icon: '📚',
            items: [
                'Students must present a valid student ID to borrow books.',
                'The standard loan period for books is 14 days.',
            ]
        },
        {
            title: 'Renewals',
            icon: '🔄',
            items: [
                'Books may be renewed once, provided they have not been reserved by another user.',
                'Renewals can be made online through the library portal or in person at the circulation desk.',
            ]
        },
        {
            title: 'Overdue Fines',
            icon: '⚠️',
            items: [
                'A fine will be imposed for each day a book is overdue.',
                'Borrowing privileges will be suspended if fines are not settled promptly.',
                'Students will not be able to borrow new books until all overdue books are returned and fines are paid.',
            ]
        },
        {
            title: 'Lost or Damaged Books',
            icon: '🔍',
            items: [
                'Borrowers are responsible for the materials they check out.',
                'If a book is lost or damaged, the borrower must report it to the library staff immediately.',
                'The borrower will be required to pay the full replacement cost of the lost or damaged book, in addition to any accrued fines.',
            ]
        },
        {
            title: 'General Conduct',
            icon: '✨',
            items: [
                'Maintain silence and a quiet atmosphere inside the library.',
                'Food and beverages are strictly prohibited.',
                'Do not leave personal belongings unattended. The library is not responsible for any loss or damage.',
                'Show respect to library staff and fellow users at all times.',
                'Mobile phones must be switched to silent mode.',
            ]
        }
    ];

    return (
        <section>
            <div className="container text-black mx-auto px-5 py-10 md:py-14">
                <div className="mb-16">
                    <h1 className="text-center text-4xl font-poppins-extra-bold mb-3">
                        Rules and Regulations for Students
                    </h1>
                    <p className="text-center text-gray-600 text-lg">
                        Please read and follow all library rules to ensure a pleasant experience for everyone
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {rules.map((rule, index) => (
                        <div 
                            key={index}
                            className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-4xl">{rule.icon}</span>
                                <h2 className="text-2xl font-poppins-semi-bold" style={{ color: '#0179ca' }}>
                                    {rule.title}
                                </h2>
                            </div>
                            <ul className="space-y-3">
                                {rule.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="flex gap-3 text-gray-700 leading-relaxed">
                                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <p className="text-gray-800 text-center">
                        <span className="font-poppins-semi-bold">Need Help?</span> If you have any questions about our library rules, 
                        please don't hesitate to contact our library staff for assistance.
                    </p>
                </div>
            </div>
        </section>
    );
};

const Page = () => {
    return (
        <div>
            <LibraryBanner />
            <LibraryRules />
        </div>
    );
};

export default Page;
