import React, { useState } from "react";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping?: () => void;
  isConnected: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  isConnected,
  placeholder = "Écrivez votre message...",
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping && e.target.value.length > 0) {
      onTyping();
    }
  };

  return (
    <div className="p-4 border-t dark:border-gray-700">
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 rounded-l-md p-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!isConnected || !message.trim()}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-r-md focus:outline-none disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
      {!isConnected && (
        <p className="text-red-500 text-sm mt-1">
          Déconnecté du serveur. Reconnexion en cours...
        </p>
      )}
    </div>
  );
};

export default MessageInput;
