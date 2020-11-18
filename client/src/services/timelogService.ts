import { TimelogResponse } from './apiService';
import { Timelog } from 'src/models/timelogModel';
import moment from 'moment';
import { parseFromApi } from './chronoService';

export function readTimelogResponse(response: TimelogResponse): Timelog {
  return {
    id: response.id,
    description: response.description,
    date: parseFromApi(response.date),
    duration: moment.duration(response.minutes, 'minutes'),
    userId: response.userId,
    userEmail: response.userEmail,
  };
}
