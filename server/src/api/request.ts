import { Request } from 'express';
import { User, UserSettings, UserRole } from 'models/userModel';
import expressCore from 'express-serve-static-core';

export class ApiError extends Error {
  httpStatus: number;

  constructor(message: string, httpStatus: number) {
    super(message);
    this.httpStatus = httpStatus;
  }
}

export type UserResponse = {
  id: string;
  email: string;
  role: UserRole;
  settings?: UserSettings;
  token?: string;
};

export type TimelogResponse = {
  id: string;
  userId: string;
  userEmail: string;
  description: string;
  date: string;
  minutes: number;
};

export type SuccessResponse = {
  success: boolean;
};

export type AuthBody = {
  email: string;
  password: string;
};

export type CreateTimelogBody = {
  userId: string;
  description: string;
  date: string;
  minutes: number;
};

export type TimelogSearchParams = {
  fromDate: string;
  toDate: string;
};

export type GetTimelogParams = {
  id: string;
};

export type DeleteTimelogParams = {
  id: string;
};

export type DeleteUserParams = {
  id: string;
};

export type CreateUserBody = {
  email: string;
  password: string;
  role: UserRole;
};

export type UpdateUserBody = {
  email?: string;
  role?: UserRole;
  settings?: Partial<UserSettings>;
};

export type UpdateUserParams = {
  id: string;
};

export type UpdateTimelogBody = Partial<CreateTimelogBody>;

export type UpdateTimelogParams = {
  id: string;
};

export type UsersResponse = {
  numUsers: number;
  users: UserResponse[];
};

export type TimelogsResponse = {
  numTimelogs: number;
  timelogs: TimelogResponse[];
};

export interface AuthenticatedRequest<
  ReqParam extends expressCore.Params = expressCore.ParamsDictionary,
  ReqBody = unknown
> extends Request<ReqParam, unknown, ReqBody, expressCore.Query> {
  user?: User;
}

export interface FullAuthenticatedRequest<
  ReqParam extends expressCore.Params = expressCore.ParamsDictionary,
  ReqBody = unknown,
  ReqQuery = expressCore.Query
> extends Request<ReqParam, unknown, ReqBody, ReqQuery> {
  user?: User;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UnauthenticatedRequest<
  ReqParam extends expressCore.Params = expressCore.ParamsDictionary,
  ReqBody = unknown
> extends Request<ReqParam, unknown, ReqBody, expressCore.Query> {}
