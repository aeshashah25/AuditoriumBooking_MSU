import React from 'react';
import { Link } from 'react-router-dom';
import Login from './Login';

function Signup() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <form>
                    {/* Close the modal button */}
                    <Link to="/" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</Link>
                </form>
                <h3 className="font-bold text-2xl text-center mb-6">Sign Up</h3>

                {/* Name */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                        type="text"
                        placeholder="Enter your Full Name"
                        className="w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {/* Email */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                        type="email"
                        placeholder="Enter your Email"
                        className="w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your Password"
                        className="w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-around mt-4">
                    <button className="bg-pink-500 text-white rounded-md px-3 py-1 hover:bg-pink-700 duration-200">SignUp</button>
                    <p>Have Account?{" "}
                        <button className="underline text-blue-500 cursor-pointer"
                        onClick={()=>document.getElementById('my_modal_3').showModal()}>
                        Login </button> <Login/> </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;