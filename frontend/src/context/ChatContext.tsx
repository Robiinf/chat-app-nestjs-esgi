"use client";

import { ReactNode } from "react";
import { SocketProvider } from "./SocketContext";
import { GlobalChatProvider } from "./GlobalChatContext";
import { DirectMessagesProvider } from "./DirectMessagesContext";

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <SocketProvider>
      <GlobalChatProvider>
        <DirectMessagesProvider>{children}</DirectMessagesProvider>
      </GlobalChatProvider>
    </SocketProvider>
  );
};

export { useSocket } from "./SocketContext";
export { useGlobalChat } from "./GlobalChatContext";
export { useDirectMessages } from "./DirectMessagesContext";
