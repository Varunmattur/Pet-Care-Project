
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  sources?: { uri: string; title: string }[];
}
