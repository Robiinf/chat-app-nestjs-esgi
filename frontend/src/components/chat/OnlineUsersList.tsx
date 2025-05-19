import React from "react";
import Link from "next/link";
import { User } from "@/types/chat";

interface OnlineUsersListProps {
  onlineUsers: User[];
  currentUserId: string;
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  onlineUsers,
  currentUserId,
}) => {
  return (
    <div className="p-4 border-b dark:border-gray-700">
      <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-3">
        UTILISATEURS EN LIGNE ({onlineUsers.length})
      </h3>
      <ul>
        {onlineUsers.map((onlineUser) => (
          <li
            key={onlineUser.id}
            className="flex items-center justify-between mb-2"
          >
            <div className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-gray-800 dark:text-gray-200">
                {onlineUser.username}
              </span>
            </div>
            {onlineUser.id !== currentUserId && (
              <Link
                href={`/messages?userId=${onlineUser.id}`}
                className="text-xs text-indigo-500 hover:underline"
              >
                Message
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsersList;
