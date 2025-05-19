import React from "react";
import { Conversation } from "@/types/chat";
import { formatTime } from "@/utils/dateUtils";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const formatDate = (dateStr: string | Date) => {
    return formatTime(dateStr);
  };

  return (
    <div
      className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive ? "bg-gray-100 dark:bg-gray-700" : ""
      }`}
      onClick={onClick}
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
  );
};

export default ConversationItem;
