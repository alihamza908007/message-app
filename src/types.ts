export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  friendship_status?: 'none' | 'pending' | 'accepted';
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  group_id?: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  created_at: string;
  sender_username?: string;
  sender_avatar?: string;
  is_read: boolean;
}

export interface Notification {
  id: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: string;
  chatId: number;
  isGroup: boolean;
}

export interface Chat {
  id: number;
  username: string; 
  avatar_url?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  chat_type: 'dm' | 'group';
  status?: 'pending' | 'accepted';
  role?: string;
}

export interface Group {
  id: number;
  name: string;
  creator_id: number;
  avatar_url?: string;
  members?: User[];
}

export interface Friendship {
  id: number;
  username: string;
  avatar_url?: string;
  status: 'pending' | 'accepted';
}
