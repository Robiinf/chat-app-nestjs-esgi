"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSocket, useGlobalChat } from "@/context/ChatContext";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import OnlineUsersList from "@/components/chat/OnlineUsersList";
import UserProfileBar from "@/components/chat/UserProfileBar";

export default function Chat() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const { messages, onlineUsers, sendMessage } = useGlobalChat();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Online Users */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="font-bold text-lg dark:text-white">Chat Global</h2>
          <Link
            href="/messages"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Messages privés
          </Link>
        </div>

        <OnlineUsersList onlineUsers={onlineUsers} currentUserId={user.id} />

        <UserProfileBar user={user} onLogout={handleLogout} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <MessageList messages={messages} currentUserId={user.id} />

        <MessageInput onSendMessage={sendMessage} isConnected={isConnected} />
      </div>
    </div>
  );
}
