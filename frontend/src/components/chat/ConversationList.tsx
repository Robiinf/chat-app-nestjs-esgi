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

  // Trier les conversations par date du dernier message (du plus récent au plus ancien)
  const sortedConversations = [...conversations].sort((a, b) => {
    // Si une conversation n'a pas de message récent, la placer en dernier
    if (!a.latestMessage) return 1;
    if (!b.latestMessage) return -1;

    // Comparer les dates des derniers messages
    return (
      new Date(b.latestMessage.createdAt).getTime() -
      new Date(a.latestMessage.createdAt).getTime()
    );
  });

  return (
    <div className="overflow-y-auto">
      {sortedConversations.map((conversation) => (
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
