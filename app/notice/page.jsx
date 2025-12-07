'use client';
import React from 'react';
import banner from '../public/images/banner.jpg';

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
    return (
        <section>
            <div className="container text-black mx-auto px-5 py-10 md:py-14">
                <h1 className="text-center text-3xl font-poppins-bold mb-10">
                    Rules and Regulations for Students
                </h1>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-poppins-semi-bold mb-3" style={{ color: '#0179ca' }}>
                            Borrowing Books
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Students must present a valid student ID to borrow books.</li>
                            <li>A maximum of 3 books can be borrowed at one time.</li>
                            <li>The standard loan period for books is 14 days.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-poppins-semi-bold mb-3" style={{ color: '#0179ca' }}>
                            Renewals
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Books may be renewed once, provided they have not been reserved by another user.</li>
                            <li>Renewals can be made online through the library portal or in person at the circulation desk.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-poppins-semi-bold mb-3" style={{ color: '#0179ca' }}>
                            Overdue Fines
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>A fine will be imposed for each day a book is overdue.</li>
                            <li>Borrowing privileges will be suspended if fines are not settled promptly.</li>
                            <li>Students will not be able to borrow new books until all overdue books are returned and fines are paid.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-poppins-semi-bold mb-3" style={{ color: '#0179ca' }}>
                            Lost or Damaged Books
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Borrowers are responsible for the materials they check out.</li>
                            <li>If a book is lost or damaged, the borrower must report it to the library staff immediately.</li>
                            <li>The borrower will be required to pay the full replacement cost of the lost or damaged book, in addition to any accrued fines.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-poppins-semi-bold mb-3" style={{ color: '#0179ca' }}>
                            General Conduct
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Maintain silence and a quiet atmosphere inside the library.</li>
                            <li>Food and beverages are strictly prohibited.</li>
                            <li>Do not leave personal belongings unattended. The library is not responsible for any loss or damage.</li>
                            <li>Show respect to library staff and fellow users at all times.</li>
                            <li>Mobile phones must be switched to silent mode.</li>
                        </ul>
                    </div>
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
