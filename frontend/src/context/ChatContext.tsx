"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import Cookies from "js-cookie";

interface User {
  id: string;
  username: string;
  messageColor: string;
}

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: User;
}

interface ChatContextType {
  messages: Message[];
  onlineUsers: User[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  // Connexion au socket
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = Cookies.get("token");
    if (!token) return;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        auth: {
          token: `Bearer ${token}`,
        },
      }
    );

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);

      // Demander l'historique des messages
      socketInstance.emit("getMessageHistory");
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socketInstance.on("globalMessage", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketInstance.on("messageHistory", (history: Message[]) => {
      setMessages(history);
    });

    socketInstance.on("onlineUsers", (users: User[]) => {
      setOnlineUsers(users);
    });

    socketInstance.on("userStatus", ({ userId, status }) => {
      if (status === "online") {
        // Ajouter l'utilisateur à la liste des utilisateurs en ligne
        socketInstance.emit("getOnlineUsers");
      } else {
        // Retirer l'utilisateur de la liste des utilisateurs en ligne
        setOnlineUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId)
        );
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  const sendMessage = useCallback(
    (text: string) => {
      if (socket && isConnected) {
        socket.emit("globalMessage", { text });
      }
    },
    [socket, isConnected]
  );

  const value = {
    messages,
    onlineUsers,
    sendMessage,
    isConnected,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
