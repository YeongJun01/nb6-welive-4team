export interface EventResponse {
  id: string;
  start: Date;
  end: Date;
  title: string;
  category: string;
  type: 'POLL' | 'NOTICE';
}