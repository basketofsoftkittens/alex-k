import config from './configService';
import urlJoin from 'url-join';
import { User } from 'src/models/userModel';

type ErrorResponse = {
  message: string;
};

type ApiCallArgs<B> = {
  method: string;
  path: string;
  apiToken?: string;
  payload?: B;
};

export type UserResponse = User & { token?: string };

export type TimelogResponse = {
  id: string;
  description: string;
  date: string;
  minutes: number;
  userId: string;
  userEmail: string;
};

export type TimelogsResponse = {
  numTimelogs: number;
  timelogs: [TimelogResponse];
};

export type UsersResponse = {
  numUsers: number;
  users: [UserResponse];
};

export type Params = { [k: string]: string };

async function apiCall<T, B>({ method, path, apiToken, payload }: ApiCallArgs<B>): Promise<T> {
  try {
    const response = await fetch(urlJoin(config.apiBaseUrl, path), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : undefined),
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (response.ok) {
      return response.json();
    }
    let errorData;
    try {
      errorData = (await response.json()) as ErrorResponse;
    } catch (e) {
      throw new Error('server error');
    }
    throw new Error(`API Error: ${errorData.message}`);
  } catch (e) {
    console.warn(e);
    throw e;
  }
}

export async function authenticatedGet<T>(path: string, apiToken: string, params?: Params): Promise<T> {
  return apiCall<T, undefined>({
    method: 'GET',
    apiToken,
    path: params ? `${path}?${new URLSearchParams(params).toString()}` : path,
  });
}

export async function authenticatedPost<T, B>(path: string, apiToken: string, body?: B): Promise<T> {
  return apiCall<T, B>({
    method: 'POST',
    apiToken,
    path,
    payload: body,
  });
}

export async function authenticatedDelete<T>(path: string, apiToken: string): Promise<T> {
  return apiCall<T, undefined>({
    method: 'DELETE',
    apiToken,
    path,
  });
}

export async function unauthenticatedPost<T, B>(path: string, body?: B): Promise<T> {
  return apiCall<T, B>({
    method: 'POST',
    path,
    payload: body,
  });
}

export async function unauthenticatedPut<T, B>(path: string, body?: B): Promise<T> {
  return apiCall<T, B>({
    method: 'PUT',
    path,
    payload: body,
  });
}

export async function authenticatedPut<T, B>(path: string, apiToken: string, body?: B): Promise<T> {
  return apiCall<T, B>({
    method: 'PUT',
    apiToken,
    path,
    payload: body,
  });
}
