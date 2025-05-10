"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/api";
import { useRouter } from "next/navigation";
import { HexColorPicker } from "react-colorful";

export default function Profile() {
  const { user, setUser, isLoading } = useAuth();
  const [selectedColor, setSelectedColor] = useState("#1e88e5"); // Default blue
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    if (user && user.messageColor) {
      setSelectedColor(user.messageColor);
    }
  }, [user]);

  // Safe color setter that ensures we never set undefined/null
  const handleColorChange = (newColor) => {
    // Ensure we always have a valid string value
    if (newColor && typeof newColor === "string") {
      setSelectedColor(newColor);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const response = await UserService.updateProfile({
        messageColor: selectedColor,
      });

      if (response.data.user) {
        setUser({
          ...user,
          messageColor: response.data.user.messageColor || "#1e88e5",
        });
        setMessage({ text: "Profile updated successfully", type: "success" });
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ text: "Failed to update profile", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  // Example message preview with the selected color
  const MessagePreview = () => (
    <div className="p-4 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Message Preview:
      </p>
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
        <div className="flex items-start">
          <div className="font-medium mr-2">{user.username}:</div>
          <div style={{ color: selectedColor }}>
            This is how your messages will appear in the chat.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Your Profile
        </h1>

        {message.text && (
          <div
            className={`p-4 mb-4 rounded ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6">
          <p className="mb-2 text-gray-700 dark:text-gray-300">
            Username: <span className="font-bold">{user.username}</span>
          </p>
          <p className="mb-2 text-gray-700 dark:text-gray-300">
            Email: <span className="font-bold">{user.email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Message Color
            </h3>

            <div className="flex flex-col items-center mb-4">
              <HexColorPicker
                color={selectedColor}
                onChange={handleColorChange}
                className="mb-4"
              />

              <div className="flex items-center space-x-3 w-full">
                <div
                  className="w-10 h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                />
                <input
                  type="text"
                  value={selectedColor || "#1e88e5"} // Ensure we always have a value
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  pattern="^#([A-Fa-f0-9]{6})$"
                  title="Hex color code (e.g. #1e88e5)"
                />
              </div>
            </div>

            <MessagePreview />
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              type="submit"
              disabled={updating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Back to Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
