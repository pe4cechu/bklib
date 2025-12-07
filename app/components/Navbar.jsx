// app/components/Navbar.jsx
'use client';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import logo from '@/app/public/icons/logo.svg';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/context/SessionProvider';

const Navbar = () => {
    const router = useRouter();
    const { user, logout: sessionLogout } = useSession();
    const [open, setOpen] = useState(false);
    const avatarRef = useRef(null);

    const login = () => {
        setOpen(false);
        router.push('/login');
    };

    const register = () => {
        setOpen(false);
        router.push('/register');
    };

    const logout = () => {
        sessionLogout();
        setOpen(false);
        router.push('/');
    };

    const goToProfile = () => {
        setOpen(false);
        router.push('/profile');
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const avatarContent = user ? (
        user.name.charAt(0).toUpperCase()
    ) : (
        // simple SVG user icon when no user
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
        </svg>
    );

    return (
        <nav className="bg-white sticky z-100 top-0 shadow-md">
            <div className="flex items-center w-full">
                <div className="pl-20">
                    <Link href="/">
                        <img src={logo.src} alt="Logo" className="w-20 h-20" />
                    </Link>
                </div>

                <ul className="flex text-[17px] font-poppins-normal space-x-14 justify-center flex-grow text-[#212121]">
                    <li>
                        <Link href="/notice">Notice</Link>
                    </li>
                    {!(user?.role === 'admin' || user?.privilege === 'admin') && (
                        <li>
                            <Link href="/books">Books</Link>
                        </li>
                    )}
                    {!(user?.role === 'admin' || user?.privilege === 'admin') && (
                        <li>
                            <Link href="/requests">Requests</Link>
                        </li>
                    )}
                    {(user?.role === 'admin' || user?.privilege === 'admin') && (
                        <li>
                            <Link href="/admin/books">Books</Link>
                        </li>
                    )}
                    {(user?.role === 'admin' || user?.privilege === 'admin') && (
                        <li>
                            <Link href="/admin/requests">Requests</Link>
                        </li>
                    )}
                </ul>

                <div className="pr-20 flex items-center">
                    {/* Avatar + dropdown */}
                    <div className="relative" ref={avatarRef}>
                        <button
                            onClick={() => setOpen((s) => !s)}
                            className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
                            aria-expanded={open}
                            aria-haspopup="true"
                        >
                            <span className="text-sm font-medium text-gray-700">
                                {avatarContent}
                            </span>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-44 font-poppins-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-md shadow-lg z-50">
                                {user ? (
                                    <div className="py-2">
                                        <button
                                            onClick={goToProfile}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-1">
                                        <button
                                            onClick={login}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={register}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                        >
                                            Register
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
