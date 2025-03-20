import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { FaHome, FaEye, FaUser, FaSignOutAlt, FaClipboardList, FaBars, FaTimes } from "react-icons/fa";
import { MdPayments, MdEvent } from "react-icons/md";
import { BsFillBookmarkCheckFill } from "react-icons/bs";
import DashboardContent from "./DashboardContent";
import CreateAuditorium from "../admin/CreateAuditoriums";
import ViewAuditoriums from "../admin/ViewAuditoriums";
import ViewUser from "../admin/ViewUser";
import ViewBookingRequests from "../admin/ViewBookingRequests";
import ViewBookingStatus from "../admin/ViewBookingStatus";
import ViewPaymentStatus from "../admin/ViewPaymentStatus";
import ViewEventStatus from "../admin/ViewEventStatus";

const DashBoard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      navigate("/");
      return;
    }
    axios
      .get("http://localhost:5000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem("jwt_token");
        navigate("/");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed lg:static top-0 left-0 h-screen lg:w-[250px] w-[250px] bg-gray-900 text-white transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 shadow-lg`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes size={22} />
          </button>
        </div>
        <nav className="min-w-[250px] max-w-[320px] flex flex-col mt-4 space-y-4 px-4">
          <Link to="/DashBoard/create-auditorium" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><FaHome className="mr-2" /> Add Auditorium</Link>
          <Link to="/DashBoard/view-auditoriums" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><FaEye className="mr-2" /> View Auditorium</Link>
          <Link to="/DashBoard/view-user" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><FaUser className="mr-2" /> View User</Link>
          <Link to="/DashBoard/view-booking-requests" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><FaClipboardList className="mr-2" /> View Booking Requests</Link>
          <Link to="/DashBoard/view-booking-status" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><BsFillBookmarkCheckFill className="mr-2" /> View Booking Status</Link>
          <Link to="/DashBoard/view-payment-status" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><MdPayments className="mr-2" /> View Payment Status</Link>
          <Link to="/DashBoard/view-event-status" className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"><MdEvent className="mr-2" /> View Event Status</Link>
        </nav>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 h-screen lg:ml-[250px]">
        {/* Top Navbar */}
        <div className="fixed top-0 left-0 lg:left-[250px] w-full lg:w-[calc(100%-250px)] bg-white shadow-md px-4 lg:px-6 py-4 flex justify-between items-center">
          {/* <button className="text-gray-900 lg:hidden flex items-center absolute left-4 top-1/2 transform -translate-y-1/2" onClick={() => setIsSidebarOpen(true)}>
            <FaBars size={26} />
          </button> */}

          <button
            className="text-gray-900 lg:hidden flex items-center absolute left-4 top-1/2 transform -translate-y-1/2"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} // Toggle state
          >
            {isSidebarOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
          </button>

          <h1 className="text-lg md:text-xl font-semibold text-center flex-1 md:flex-none">
            Welcome, {user?.name || "User"}!
          </h1>
          <div className="relative group">
            <img className="w-10 h-10 rounded-full cursor-pointer transition-transform duration-200 hover:scale-105 hover:ring-2 hover:ring-gray-300"
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" alt="User Avatar" />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="flex w-full px-4 py-2 text-left hover:bg-red-500 hover:text-white transition" onClick={handleLogout}>
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="lg:w-[calc(100%+280px)] lg:ml-[-280px] flex-1 overflow-auto mt-[72px] p-4">
          {error && <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-3 rounded my-4">{error}</div>}
          <Routes>
            <Route index element={<DashboardContent />} />
            <Route path="create-auditorium" element={<CreateAuditorium />} />
            <Route path="/create-auditorium/:id?" element={<CreateAuditorium />} />
            <Route path="view-auditoriums" element={<ViewAuditoriums />} />
            <Route path="view-user" element={<ViewUser />} />
            <Route path="view-booking-requests" element={<ViewBookingRequests />} />
            <Route path="view-booking-status" element={<ViewBookingStatus />} />
            <Route path="view-payment-status" element={<ViewPaymentStatus />} />
            <Route path="view-event-status" element={<ViewEventStatus />} />
          </Routes>
        </div>
      </div>

    </div>

  );
};

export default DashBoard;
