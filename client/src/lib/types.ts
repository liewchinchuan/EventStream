export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface EventStats {
  activeEvents: number;
  totalParticipants: number;
  questionsAsked: number;
  engagementRate: string;
}

export interface PollResults {
  pollId: number;
  question: string;
  type: string;
  totalResponses: number;
  results: PollOption[];
}

export interface PollOption {
  option: string;
  count: number;
  percentage: number;
}

export interface ParticipantActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'join' | 'question' | 'poll' | 'vote';
}
