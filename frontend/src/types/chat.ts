export interface User {
  id: string;
  username: string;
  messageColor: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: User;
}

export interface DirectMessage extends Message {
  recipientId: string;
  isRead?: boolean;
  readAt?: Date;
}

export interface Conversation {
  user: {
    id: string;
    username: string;
    isOnline: boolean;
  };
  latestMessage: {
    text: string;
    createdAt: Date;
    isFromUser: boolean;
  } | null;
}