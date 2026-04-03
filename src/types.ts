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
  receiver_id: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  created_at: string;
}

export interface Chat {
  id: number;
  username: string;
  avatar_url?: string;
  last_message?: string;
  last_message_at?: string;
  unreadCount?: number;
}

export interface Friendship {
  id: number;
  username: string;
  avatar_url?: string;
  status: 'pending' | 'accepted';
}
