import React, { useRef, useEffect } from "react";
import { Message, DirectMessage } from "@/types/chat";
import { formatTime, formatMessageDate, isSameDay } from "@/utils/dateUtils";
import MessageBubble from "./MessageBubble";
import DateSeparator from "./DateSeparator";

interface MessageListProps {
  messages: (Message | DirectMessage)[];
  currentUserId: string;
  showReadStatus?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  showReadStatus = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">
          Aucun message. Commencez la conversation!
        </p>
      </div>
    );
  }

  // Group messages by date
  let result = [];
  let lastDate = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const messageDate = new Date(message.createdAt);

    // Add date separator if needed
    if (!lastDate || !isSameDay(lastDate, messageDate)) {
      result.push(<DateSeparator key={`date-${i}`} date={messageDate} />);
      lastDate = messageDate;
    }

    // Add message
    result.push(
      <MessageBubble
        key={message.id}
        message={message}
        isOwnMessage={message.user.id === currentUserId}
        showReadStatus={showReadStatus && "recipientId" in message}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {result}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
