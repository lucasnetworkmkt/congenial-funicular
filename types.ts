export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachment?: Attachment;
  isStreaming?: boolean;
  timestamp: number;
}

export type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  model: ModelType;
}

// SaaS Specific Types - Restaurant Domain
export interface Reservation {
  id: string;
  clientName: string;
  phone: string;
  pax: string; // Keep as string for select value compatibility or convert to number
  time: string;
  date: string;
  tableType: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'starter' | 'main' | 'dessert' | 'drink';
  popular?: boolean;
}

export type AppView = 'public' | 'admin';
