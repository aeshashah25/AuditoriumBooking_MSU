import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Auditourim from "../auditourim/Auditourim";
import FixedLayout from './FixedLayout';

const MainPage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(null);
  const [auditoriums, setAuditoriums] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Feedback states
  const [selectedAuditorium, setSelectedAuditorium] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const navigate = useNavigate();

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const { exp } = JSON.parse(atob(token.split(".")[1]));
      return exp < Math.floor(Date.now() / 1000);
    } catch (e) {
      console.error("Error decoding token:", e);
      return true;
    }
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

        if (response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("userId", response.data.user.id);
          const { exp } = JSON.parse(atob(token.split(".")[1]));
          setTokenExpiration(exp);

          // Fetch Profile Picture
          try {
            const profilePicResponse = await axios.get(
              `http://localhost:5000/api/user/profile-pic/${response.data.user.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob", // 👈 Ensure it's a blob
              }
            );

            if (profilePicResponse.status === 200) {
              const imageUrl = URL.createObjectURL(profilePicResponse.data);
              setProfilePicUrl(imageUrl);
            } else {
              console.warn("Profile picture not found, using default image.");
              setProfilePicUrl("/default-profile.png"); // 👈 Use a default image
            }
          } catch (error) {
            console.log("Error fetching profile picture:", error);
            setProfilePicUrl("/default-profile.png"); // 👈 Fallback image
          }
        }
      } catch (error) {
        setError("Failed to fetch user data. Please log in again.");
        localStorage.removeItem("jwt_token");
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate, tokenExpiration]);

  const handleUpdate = () => {
    navigate("/UpdateProfile", { state: { user, profilePicUrl } });
  };

  const handleFeedbackSubmit = async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!selectedAuditorium || !feedback.trim()) {
      alert("Please select an auditorium and enter feedback.");
      return;
    }

    const feedbackData = {
      auditoriumId: parseInt(selectedAuditorium),
      userId: parseInt(storedUserId),
      feedback: feedback.trim(),
    };

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await axios.post("http://localhost:5000/api/feedback", feedbackData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201) {
        alert("Feedback submitted successfully!");
        setShowFeedbackPopup(false);
        setFeedback("");
      } else {
        alert("Failed to submit feedback. Try again.");
      }
    } catch (error) {
      alert("Error submitting feedback. Please try again later.");
    }
  };

  // Ensure auditoriums load correctly
  useEffect(() => {
    const fetchAuditoriums = async () => {
      try {
        const response = await axios.get("http://localhost:5002/api/auditoriums");

        if (response.status === 200) {
          // console.log("Fetched auditoriums:", response.data); // Debugging log
          setAuditoriums(response.data);
        }
      } catch (error) {
        console.error("Error fetching auditoriums:", error);
      }
    };

    fetchAuditoriums();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100 px-4 py-6">
        {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <FixedLayout>
          {/* Auditorium Section */}
          <div className="mt-6">
            <Auditourim />
          </div>
        </FixedLayout>
      </div>
    </>
  );
};

export default MainPage;
