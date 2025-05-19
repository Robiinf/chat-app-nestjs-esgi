import React, { useState } from "react";
import { User } from "@/types/chat";
import { Search } from "lucide-react";

interface UserSearchProps {
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onSelectUser: (userId: string) => void;
  results: User[];
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({
  onSearch,
  onClearSearch,
  onSelectUser,
  results,
  isSearching,
  setIsSearching,
}) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 2) {
      onSearch(value);
    } else {
      onClearSearch();
    }
  };

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    setQuery("");
    setIsSearching(false);
    onClearSearch();
  };

  return (
    <div className="p-3 border-b dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsSearching(!isSearching)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <Search size={18} className="text-gray-500" />
        </button>
        {isSearching && (
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Rechercher un utilisateur..."
            className="flex-1 p-1 text-sm outline-none border-b border-gray-200 dark:border-gray-600 bg-transparent dark:text-white"
            autoFocus
          />
        )}
      </div>

      {/* Results */}
      {isSearching && results.length > 0 && (
        <div className="mt-2 border rounded-md border-gray-200 dark:border-gray-700">
          {results.map((user) => (
            <div
              key={user.id}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center"
              onClick={() => handleSelectUser(user.id)}
            >
              <div className="flex items-center">
                {user.isOnline && (
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                )}
                <span className="dark:text-white">{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isSearching && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Aucun utilisateur trouvé
        </p>
      )}
    </div>
  );
};

export default UserSearch;
