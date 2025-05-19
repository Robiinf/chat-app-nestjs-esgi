import React from "react";
import { Message, DirectMessage } from "@/types/chat";
import { formatTime } from "@/utils/dateUtils";

interface MessageBubbleProps {
  message: Message | DirectMessage;
  isOwnMessage: boolean;
  showReadStatus: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showReadStatus,
}) => {
  const formatDate = (dateStr: string | Date) => {
    return formatTime(dateStr);
  };

  const isDirectMessage = "recipientId" in message;
  const readStatus =
    isDirectMessage && isOwnMessage && showReadStatus ? (
      <span className="ml-1">
        {message.isRead ? (
          <span
            title={`Lu ${message.readAt ? formatDate(message.readAt) : ""}`}
          >
            ✓✓
          </span>
        ) : (
          <span>✓</span>
        )}
      </span>
    ) : null;

  return (
    <div
      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage
            ? "bg-indigo-500 text-white"
            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        }`}
      >
        {!isOwnMessage && (
          <div
            className="font-bold mb-1"
            style={{ color: message.user.messageColor }}
          >
            {message.user.username}
          </div>
        )}
        <div>{message.text}</div>
        <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end">
          <span>{formatDate(message.createdAt)}</span>
          {readStatus}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
