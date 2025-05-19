import React from "react";
import { Conversation } from "@/types/chat";
import ConversationItem from "./ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (userId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
}) => {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">Aucune conversation</div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.user.id}
          conversation={conversation}
          isActive={activeConversationId === conversation.user.id}
          onClick={() => onSelectConversation(conversation.user.id)}
        />
      ))}
    </div>
  );
};

export default ConversationList;
