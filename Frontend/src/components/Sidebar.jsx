import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false); // State to handle sidebar visibility

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            {/* Sidebar */}
            <div className={`fixed inset-0 flex z-30 lg:z-20 ${isOpen ? 'block' : 'hidden'} lg:block`}>
                <div className="flex flex-col w-64 bg-brown-800 text-white shadow-xl h-full">
                    <div className="flex items-center justify-between p-4 border-b border-brown-700">
                        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                        <button
                            className="lg:hidden text-white"
                            onClick={toggleSidebar}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-col p-4 space-y-4">
                        <Link to="/ViewAuditoriums" className="text-white hover:text-gray-400">
                            Auditorium
                        </Link>
                        <Link to="/ViewBookingRequest" className="text-white hover:text-gray-400">
                            View Booking Request
                        </Link>
                        <Link to="/logout" className="text-white hover:text-gray-400">
                            Logout
                        </Link>
                    </nav>
                </div>

                {/* Overlay for smaller screens */}
                <div
                    className={`fixed inset-0 bg-black opacity-50 lg:hidden ${isOpen ? 'block' : 'hidden'}`}
                    onClick={toggleSidebar}
                ></div>
            </div>

            {/* Main Content */}
            <div className={`lg:ml-64 ${isOpen ? 'ml-0' : ''} transition-all`}>
                {/* Content goes here */}
            </div>
        </div>
    );
};

export default Sidebar;
