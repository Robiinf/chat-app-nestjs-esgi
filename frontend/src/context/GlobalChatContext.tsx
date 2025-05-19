"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import { User } from "@/types/chat";

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: User;
}

interface GlobalChatContextType {
  messages: Message[];
  onlineUsers: User[];
  sendMessage: (text: string) => void;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(
  undefined
);

export const GlobalChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  // Set up socket event listeners for global chat
  useEffect(() => {
    if (!socket) return;

    // Request initial data
    socket.emit("getMessageHistory");

    // Message listeners
    const handleGlobalMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleMessageHistory = (history: Message[]) => {
      setMessages(history);
    };

    // User status listeners
    const handleOnlineUsers = (users: User[]) => {
      setOnlineUsers(users);
    };

    const handleUserStatus = ({
      userId,
      status,
    }: {
      userId: string;
      status: string;
    }) => {
      if (status === "online") {
        socket.emit("getOnlineUsers");
      } else {
        setOnlineUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId)
        );
      }
    };

    // Register event listeners
    socket.on("globalMessage", handleGlobalMessage);
    socket.on("messageHistory", handleMessageHistory);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userStatus", handleUserStatus);

    // Clean up
    return () => {
      socket.off("globalMessage", handleGlobalMessage);
      socket.off("messageHistory", handleMessageHistory);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userStatus", handleUserStatus);
    };
  }, [socket]);

  const sendMessage = useCallback(
    (text: string) => {
      if (socket && isConnected) {
        socket.emit("globalMessage", { text });
      }
    },
    [socket, isConnected]
  );

  return (
    <GlobalChatContext.Provider
      value={{
        messages,
        onlineUsers,
        sendMessage,
      }}
    >
      {children}
    </GlobalChatContext.Provider>
  );
};

export const useGlobalChat = (): GlobalChatContextType => {
  const context = useContext(GlobalChatContext);
  if (context === undefined) {
    throw new Error("useGlobalChat must be used within a GlobalChatProvider");
  }
  return context;
};
