import React from "react";
import Link from "next/link";
import { User } from "@/types/chat";

interface UserProfileBarProps {
  user: User;
  onLogout: () => void;
}

const UserProfileBar: React.FC<UserProfileBarProps> = ({ user, onLogout }) => {
  return (
    <div className="mt-auto p-4 border-t dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-medium dark:text-white">{user.username}</span>
          <Link
            href="/profile"
            className="text-xs text-indigo-600 hover:text-indigo-500"
          >
            Mon profil
          </Link>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default UserProfileBar;
