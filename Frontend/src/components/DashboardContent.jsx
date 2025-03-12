import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";

//import { CheckCircle } from "lucide-react";
const DashboardContent = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAuditoriums: 0,
    pendingRequests: 0,
    completedBookings: 0,
    paymentRequests: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5002/api/dashboard-stats"); // Adjust API endpoint
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const isTokenExpired = (token) => {
    if (!token) return true;
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return exp < Math.floor(Date.now() / 1000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwt_token");

      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("jwt_token");
        navigate("/");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        setError("Failed to fetch user data. Please log in again.");
        localStorage.removeItem("jwt_token");
        navigate("/");
      }
    };

    fetchUser();
    const intervalId = setInterval(() => {
      if (isTokenExpired(localStorage.getItem("jwt_token"))) {
        localStorage.removeItem("jwt_token");
        setUser(null);
        navigate("/");
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  
  return (
    <div className="flex min-h-screen w-full bg-gray-100">
   
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-[300px] transition-all">
        {/* Navbar */}
        <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
          <button className="lg:hidden text-gray-700" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaBars size={24} />
          </button>
          <h1 className="text-xl font-semibold">Welcome, {user?.name || "User"}!</h1>
          <div className="relative">
            <img
              className="w-10 h-10 rounded-full"
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              alt="User Avatar"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-3 rounded my-4">
            {error}
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 flex flex-col p-6 bg-white shadow-lg rounded-lg mx-4 my-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
          <p className="text-gray-700">Manage all auditorium bookings and requests from here.</p>

          {/* Responsive Cards for Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Total Auditoriums - Blue */}
            <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold">Total Auditoriums</h3>
              <p className="text-3xl mt-2">{stats.totalAuditoriums}</p>
            </div>

            {/* Pending Requests - Orange (Attention) */}
            <div className="bg-orange-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold">Pending Requests</h3>
              <p className="text-3xl mt-2">{stats.pendingRequests}</p>
            </div>

            {/* Payment Requests - Purple (Finance) */}
            <div className="bg-purple-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold">Payment Requests</h3>
              <p className="text-3xl mt-2">{stats.paymentRequests}</p>
            </div>

            {/* Completed Bookings - Green (Success) */}
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold">Completed Bookings</h3>
              <p className="text-3xl mt-2">{stats.completedBookings}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardContent; 