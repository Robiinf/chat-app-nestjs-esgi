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
  isOnline?: boolean;
}

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: User;
}

interface DirectMessage extends Message {
  recipientId: string;
  isRead?: boolean;
  readAt?: Date;
}

interface Conversation {
  user: {
    id: string;
    username: string;
    isOnline: boolean;
  };
  latestMessage: {
    text: string;
    createdAt: Date;
    isFromUser: boolean;
  } | null;
}

interface ChatContextType {
  messages: Message[];
  onlineUsers: User[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
  directMessages: Record<string, DirectMessage[]>;
  sendDirectMessage: (text: string, recipientId: string) => void;
  openDirectChat: (userId: string) => void;
  conversations: Conversation[];
  activeConversation: string | null;
  searchUsers: (username: string) => void;
  searchResults: User[];
  clearSearchResults: () => void;
  typingUsers: Record<string, boolean>;
  handleTyping: (recipientId: string) => void;
  markMessagesAsRead: (messageIds: string[], senderId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
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
  const { user, isAuthenticated } = useAuth();

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

    // Ajouter les écouteurs pour les messages directs
    socketInstance.on("directMessage", (message: DirectMessage) => {
      setDirectMessages((prevMessages) => {
        const otherUserId =
          message.user.id === user?.id ? message.recipientId : message.user.id;
        const prevUserMessages = prevMessages[otherUserId] || [];
        return {
          ...prevMessages,
          [otherUserId]: [...prevUserMessages, message],
        };
      });

      // Si nous recevons un message d'un nouvel utilisateur, mettre à jour les conversations
      socketInstance.emit("getConversations");
    });

    socketInstance.on(
      "directMessageHistory",
      ({ userId, messages }: { userId: string; messages: DirectMessage[] }) => {
        setDirectMessages((prev) => ({
          ...prev,
          [userId]: messages,
        }));
      }
    );

    socketInstance.on("conversations", (newConversations: Conversation[]) => {
      setConversations(newConversations);
    });

    socketInstance.on("searchResults", (results: User[]) => {
      setSearchResults(results);
    });

    socketInstance.on("error", (error) => {
      console.error("Erreur socket:", error);
      // Optionnel: afficher un message d'erreur dans l'UI
    });

    socketInstance.on("conversationStarted", (data) => {
      console.log("Nouvelle conversation démarrée avec:", data);
      // Si besoin, ajouter un traitement spécifique ici
    });

    socketInstance.on("newConversation", (conversation) => {
      setConversations((prev) => {
        // Vérifier si cette conversation existe déjà
        const exists = prev.some((c) => c.user.id === conversation.user.id);
        if (exists) {
          return prev;
        } else {
          return [...prev, conversation];
        }
      });
    });

    socketInstance.on("userTyping", ({ userId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    });

    socketInstance.on("messagesRead", ({ messageIds, readerId }) => {
      setDirectMessages((prev) => {
        const newDirectMessages = { ...prev };

        // Pour chaque conversation
        Object.keys(newDirectMessages).forEach((userId) => {
          if (userId === readerId) {
            // Marquer les messages comme lus
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
    });

    // Demander les conversations au chargement
    socketInstance.emit("getConversations");

    setSocket(socketInstance);

    return () => {
      socketInstance.off("directMessage");
      socketInstance.off("directMessageHistory");
      socketInstance.off("conversations");
      socketInstance.off("searchResults");
      socketInstance.off("newConversation");
      socketInstance.off("userTyping");
      socketInstance.off("messagesRead");
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated && socket) {
      console.log(
        "Déconnexion du socket suite à la déconnexion de l'utilisateur"
      );
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setMessages([]);
      setDirectMessages({});
      setConversations([]);
      setOnlineUsers([]);
      setActiveConversation(null);
      setSearchResults([]);
    }
  }, [isAuthenticated, socket]);

  const sendMessage = useCallback(
    (text: string) => {
      if (socket && isConnected) {
        socket.emit("globalMessage", { text });
      }
    },
    [socket, isConnected]
  );

  const openDirectChat = useCallback(
    (userId: string) => {
      console.log(`Ouverture de la conversation avec l'utilisateur: ${userId}`);

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

  const value = {
    messages,
    onlineUsers,
    sendMessage,
    isConnected,
    directMessages,
    sendDirectMessage,
    openDirectChat,
    conversations,
    activeConversation,
    searchUsers,
    searchResults,
    clearSearchResults,
    typingUsers,
    handleTyping,
    markMessagesAsRead,
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
