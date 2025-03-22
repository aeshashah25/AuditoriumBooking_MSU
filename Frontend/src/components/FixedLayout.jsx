import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function FixedLayout({ children }) {
    return (
        <>
            <Header />
            <main className="min-h-screen p-4">{children}</main>
            <Footer />
        </>
    );
}

export default FixedLayout;

//this is static content after Login Page