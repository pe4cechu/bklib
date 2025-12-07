import './globals.css';
import PropTypes from 'prop-types';
import { BookProvider } from './context/BookContext';
import { SessionProvider } from './context/SessionProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageLoadToast from './components/PageLoadToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import favicon from '@/app/public/icons/favicon.svg';

export const metadata = {
    title: 'BKLib',
    description: '',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href={favicon.src} />
                <title>BKLib</title>
            </head>
            <body>
                <SessionProvider>
                    <BookProvider>
                        <ToastContainer
                            position="top-center"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                        <PageLoadToast />
                        <Navbar />
                        {children}
                        <Footer />
                    </BookProvider>
                </SessionProvider>
            </body>
        </html>
    );
}

RootLayout.propTypes = {
    children: PropTypes.node.isRequired,
};
