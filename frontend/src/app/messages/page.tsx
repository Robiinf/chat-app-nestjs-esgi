"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSocket, useDirectMessages } from "@/context/ChatContext";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ConversationList from "@/components/chat/ConversationList";
import UserSearch from "@/components/chat/UserSearch";
import UserProfileBar from "@/components/chat/UserProfileBar";

export default function DirectMessages() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const {
    conversations,
    directMessages,
    sendDirectMessage,
    openDirectChat,
    activeConversation,
    searchUsers,
    searchResults,
    clearSearchResults,
    typingUsers,
    handleTyping,
    markMessagesAsRead,
  } = useDirectMessages();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSearching, setIsSearching] = useState(false);

  // Open conversation from URL query parameter
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && isConnected) {
      openDirectChat(userId);
    }
  }, [searchParams, isConnected, openDirectChat]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (activeConversation && user && directMessages[activeConversation]) {
      const unreadMessages = directMessages[activeConversation]
        .filter((msg) => !msg.isRead && msg.user.id !== user.id)
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages, activeConversation);
      }
    }
  }, [activeConversation, directMessages, user, markMessagesAsRead]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSendMessage = (text: string) => {
    if (activeConversation) {
      sendDirectMessage(text, activeConversation);
    }
  };

  const handleUserTyping = () => {
    if (activeConversation) {
      handleTyping(activeConversation);
    }
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

        <UserSearch
          onSearch={searchUsers}
          onClearSearch={clearSearchResults}
          onSelectUser={openDirectChat}
          results={searchResults}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
        />

        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation}
          onSelectConversation={openDirectChat}
        />

        <UserProfileBar user={user} onLogout={handleLogout} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 flex items-center">
              <h2 className="font-bold text-lg dark:text-white flex items-center">
                {activeChat.isOnline && (
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                )}
                {activeChat.username}
              </h2>

              {/* Typing indicator */}
              {activeConversation && typingUsers[activeConversation] && (
                <span className="ml-2 text-sm text-gray-500 italic">
                  En train d'écrire...
                </span>
              )}
            </div>

            <MessageList
              messages={currentMessages}
              currentUserId={user.id}
              showReadStatus={true}
            />

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleUserTyping}
              isConnected={isConnected}
            />
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
