import { User } from 'models/userModel';
import { generateToken } from 'services/jwtService';
import { PopulatedTimelog } from 'models/timelogModel';
import { formatForApi } from 'services/chronoService';
import { UserResponse, TimelogResponse } from 'api/request';

export type UserBlueprintOptions = {
  withToken?: boolean;
};

export function userBlueprint(user: User, options?: UserBlueprintOptions): UserResponse {
  const out: UserResponse = {
    id: user.id,
    email: user.email,
    role: user.role,
    settings: user.settings,
  };
  if (options?.withToken) {
    out.token = generateToken(user.id);
  }
  return out;
}

export function timelogBlueprint(timelog: PopulatedTimelog): TimelogResponse {
  const out: TimelogResponse = {
    id: timelog.id,
    description: timelog.description,
    userId: timelog.user.id,
    userEmail: timelog.user.email,
    date: formatForApi(timelog.date),
    minutes: timelog.minutes,
  };
  return out;
}
