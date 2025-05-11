"use client";

import React, { useState, useRef, useEffect } from "react";
import { useState as useStateReact } from "react";
import { Search } from "lucide-react"; // Si vous utilisez lucide-react, sinon utilisez une autre icône
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DirectMessages() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const {
    conversations,
    directMessages,
    sendDirectMessage,
    openDirectChat,
    activeConversation,
    onlineUsers,
    isConnected,
    searchUsers,
    searchResults,
    clearSearchResults,
  } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useStateReact("");
  const [isSearching, setIsSearching] = useStateReact(false);

  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && isConnected) {
      openDirectChat(userId);
    }
  }, [searchParams, isConnected, openDirectChat]);

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation, directMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected && activeConversation) {
      sendDirectMessage(newMessage.trim(), activeConversation);
      setNewMessage("");
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      searchUsers(query);
    } else {
      clearSearchResults();
    }
  };

  const startNewConversation = (userId: string) => {
    console.log("Démarrage d'une conversation avec l'utilisateur:", userId);
    openDirectChat(userId);
    setIsSearching(false);
    setSearchQuery("");
    clearSearchResults();
  };

  const activeChat = activeConversation
    ? conversations.find((c) => c.user.id === activeConversation)?.user
    : null;

  const currentMessages = activeConversation
    ? directMessages[activeConversation] || []
    : [];

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
      {/* Sidebar - Conversations */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg dark:text-white">Messages</h2>
          <Link
            href="/chat"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Chat global
          </Link>
        </div>

        {/* Ajouter cette section de recherche */}
        <div className="p-3 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Search size={18} className="text-gray-500" />
            </button>
            {isSearching && (
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Rechercher un utilisateur..."
                className="flex-1 p-1 text-sm outline-none border-b border-gray-200 dark:border-gray-600 bg-transparent dark:text-white"
                autoFocus
              />
            )}
          </div>

          {/* Résultats de recherche */}
          {isSearching && searchResults.length > 0 && (
            <div className="mt-2 border rounded-md border-gray-200 dark:border-gray-700">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  onClick={() => startNewConversation(user.id)}
                >
                  <div className="flex items-center">
                    {user.isOnline && (
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    )}
                    <span className="dark:text-white">{user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message si aucun résultat */}
          {isSearching &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Aucun utilisateur trouvé
              </p>
            )}
        </div>

        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.user.id}
                className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeConversation === conversation.user.id
                    ? "bg-gray-100 dark:bg-gray-700"
                    : ""
                }`}
                onClick={() => openDirectChat(conversation.user.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium dark:text-white flex items-center">
                    {conversation.user.isOnline && (
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    )}
                    {conversation.user.username}
                  </div>
                  {conversation.latestMessage && (
                    <span className="text-xs text-gray-500">
                      {formatDate(conversation.latestMessage.createdAt)}
                    </span>
                  )}
                </div>
                {conversation.latestMessage && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {conversation.latestMessage.isFromUser ? "Vous: " : ""}
                    {conversation.latestMessage.text}
                  </p>
                )}
              </div>
            ))
          )}
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
        {/* Header */}
        {activeChat ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 flex items-center">
              <h2 className="font-bold text-lg dark:text-white flex items-center">
                {activeChat.isOnline && (
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                )}
                {activeChat.username}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun message. Commencez la conversation!
                  </p>
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.user.id === user.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.user.id === user.id
                          ? "bg-indigo-500 text-white"
                          : "bg-white dark:bg-gray-700 dark:text-white"
                      }`}
                    >
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Sélectionnez une conversation pour commencer à discuter
          </div>
        )}
      </div>
    </div>
  );
}
