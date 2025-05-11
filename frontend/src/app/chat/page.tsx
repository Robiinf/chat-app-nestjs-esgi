"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Chat() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { messages, sendMessage, onlineUsers, isConnected } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      sendMessage(newMessage.trim());
      setNewMessage("");
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
    return null;
  }

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

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

        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-3">
            UTILISATEURS EN LIGNE ({onlineUsers.length})
          </h3>
          <ul>
            {onlineUsers.map((onlineUser) => (
              <li
                key={onlineUser.id}
                className="flex items-center justify-between mb-2"
              >
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {onlineUser.username}
                  </span>
                </div>
                {onlineUser.id !== user.id && (
                  <Link
                    href={`/messages?userId=${onlineUser.id}`}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    Message
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto p-4 border-t dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex flex-col">
              <span className="font-medium dark:text-white">
                {user.username}
              </span>
              <Link
                href="/profile"
                className="text-xs text-indigo-600 hover:text-indigo-500"
              >
                Mon profil
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun message. Soyez le premier à écrire!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.user.id === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.user.id === user.id
                      ? "bg-indigo-500 text-white"
                      : "bg-white dark:bg-gray-700 dark:text-white"
                  }`}
                >
                  {message.user.id !== user.id && (
                    <div
                      className="font-bold mb-1"
                      style={{ color: message.user.messageColor }}
                    >
                      {message.user.username}
                    </div>
                  )}
                  <div>{message.text}</div>
                  <div className="text-xs opacity-70 text-right mt-1">
                    {formatDate(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 rounded-l-md p-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-r-md focus:outline-none disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
          {!isConnected && (
            <p className="text-red-500 text-sm mt-1">
              Déconnecté du serveur. Reconnexion en cours...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
