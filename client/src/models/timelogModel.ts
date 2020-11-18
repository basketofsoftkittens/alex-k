import { Duration, Moment } from 'moment';

export type Timelog = {
  id: string;
  description: string;
  date: Moment;
  duration: Duration;
  userId: string;
  userEmail: string;
};
