"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import { User, DirectMessage, Conversation } from "@/types/chat";
import { useAuth } from "./AuthContext";

interface DirectMessagesContextType {
  directMessages: Record<string, DirectMessage[]>;
  conversations: Conversation[];
  activeConversation: string | null;
  searchResults: User[];
  typingUsers: Record<string, boolean>;
  sendDirectMessage: (text: string, recipientId: string) => void;
  openDirectChat: (userId: string) => void;
  searchUsers: (username: string) => void;
  clearSearchResults: () => void;
  handleTyping: (recipientId: string) => void;
  markMessagesAsRead: (messageIds: string[], senderId: string) => void;
}

const DirectMessagesContext = createContext<
  DirectMessagesContextType | undefined
>(undefined);

export const DirectMessagesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth(); // Récupérer l'utilisateur actuel directement
  const [directMessages, setDirectMessages] = useState<
    Record<string, DirectMessage[]>
  >({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [typingTimers, setTypingTimers] = useState<
    Record<string, NodeJS.Timeout>
  >({});

  // Set up socket event listeners for direct messages
  useEffect(() => {
    if (!socket || !user) return;

    // Request initial data
    socket.emit("getConversations");

    // Direct message handlers
    const handleDirectMessage = (message: DirectMessage) => {
      // Identifie correctement la conversation avec laquelle le message est associé
      const conversationUserId =
        message.user.id === user.id ? message.recipientId : message.user.id;

      setDirectMessages((prevMessages) => {
        const prevUserMessages = prevMessages[conversationUserId] || [];
        return {
          ...prevMessages,
          [conversationUserId]: [...prevUserMessages, message],
        };
      });

      // Update conversations list
      socket.emit("getConversations");
    };

    const handleDirectMessageHistory = ({
      userId,
      messages,
    }: {
      userId: string;
      messages: DirectMessage[];
    }) => {
      setDirectMessages((prev) => ({
        ...prev,
        [userId]: messages,
      }));
    };

    // Conversation handlers
    const handleConversations = (newConversations: Conversation[]) => {
      setConversations(newConversations);
    };

    const handleNewConversation = (conversation: Conversation) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.user.id === conversation.user.id);
        if (exists) return prev;
        return [...prev, conversation];
      });
    };

    // User search handlers
    const handleSearchResults = (results: User[]) => {
      setSearchResults(results);
    };

    // Typing indicators
    const handleUserTyping = ({
      userId,
      isTyping,
    }: {
      userId: string;
      isTyping: boolean;
    }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    };

    // Read receipts
    const handleMessagesRead = ({
      messageIds,
      readerId,
    }: {
      messageIds: string[];
      readerId: string;
    }) => {
      setDirectMessages((prev) => {
        const newDirectMessages = { ...prev };

        Object.keys(newDirectMessages).forEach((userId) => {
          if (userId === readerId) {
            newDirectMessages[userId] = newDirectMessages[userId].map((msg) => {
              if (messageIds.includes(msg.id)) {
                return { ...msg, isRead: true, readAt: new Date() };
              }
              return msg;
            });
          }
        });

        return newDirectMessages;
      });
    };

    // Register event listeners
    socket.on("directMessage", handleDirectMessage);
    socket.on("directMessageHistory", handleDirectMessageHistory);
    socket.on("conversations", handleConversations);
    socket.on("searchResults", handleSearchResults);
    socket.on("newConversation", handleNewConversation);
    socket.on("userTyping", handleUserTyping);
    socket.on("messagesRead", handleMessagesRead);

    // Clean up event listeners
    return () => {
      socket.off("directMessage", handleDirectMessage);
      socket.off("directMessageHistory", handleDirectMessageHistory);
      socket.off("conversations", handleConversations);
      socket.off("searchResults", handleSearchResults);
      socket.off("newConversation", handleNewConversation);
      socket.off("userTyping", handleUserTyping);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, user]); // Ajout de user comme dépendance

  // Reset state when socket disconnects
  useEffect(() => {
    if (!isConnected) {
      setDirectMessages({});
      setConversations([]);
      setActiveConversation(null);
      setSearchResults([]);
      setTypingUsers({});
    }
  }, [isConnected]);

  const openDirectChat = useCallback(
    (userId: string) => {
      setActiveConversation(userId);

      if (socket && isConnected) {
        socket.emit("startConversation", { recipientId: userId });
        socket.emit("getDirectMessages", { userId });
      }
    },
    [socket, isConnected]
  );

  const sendDirectMessage = useCallback(
    (text: string, recipientId: string) => {
      if (socket && isConnected) {
        socket.emit("directMessage", { text, recipientId });
      }
    },
    [socket, isConnected]
  );

  const searchUsers = useCallback(
    (username: string) => {
      if (socket && isConnected && username.trim().length > 0) {
        socket.emit("searchUsers", { username: username.trim() });
      } else {
        setSearchResults([]);
      }
    },
    [socket, isConnected]
  );

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const sendTypingStatus = useCallback(
    (recipientId: string, isTyping: boolean) => {
      if (socket && isConnected) {
        socket.emit("typing", { recipientId, isTyping });
      }
    },
    [socket, isConnected]
  );

  const handleTyping = useCallback(
    (recipientId: string) => {
      if (socket && isConnected) {
        if (typingTimers[recipientId]) {
          clearTimeout(typingTimers[recipientId]);
        }

        sendTypingStatus(recipientId, true);

        const timer = setTimeout(() => {
          sendTypingStatus(recipientId, false);
        }, 2000);

        setTypingTimers((prev) => ({
          ...prev,
          [recipientId]: timer,
        }));
      }
    },
    [socket, isConnected, sendTypingStatus, typingTimers]
  );

  const markMessagesAsRead = useCallback(
    (messageIds: string[], senderId: string) => {
      if (socket && isConnected) {
        socket.emit("messageRead", { messageIds, senderId });
      }
    },
    [socket, isConnected]
  );

  return (
    <DirectMessagesContext.Provider
      value={{
        directMessages,
        conversations,
        activeConversation,
        searchResults,
        typingUsers,
        sendDirectMessage,
        openDirectChat,
        searchUsers,
        clearSearchResults,
        handleTyping,
        markMessagesAsRead,
      }}
    >
      {children}
    </DirectMessagesContext.Provider>
  );
};

export const useDirectMessages = (): DirectMessagesContextType => {
  const context = useContext(DirectMessagesContext);
  if (context === undefined) {
    throw new Error(
      "useDirectMessages must be used within a DirectMessagesProvider"
    );
  }
  return context;
};
