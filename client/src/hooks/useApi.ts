import { AuthContext } from 'src/contexts/authContext';
import {
  authenticatedGet,
  authenticatedPost,
  unauthenticatedPost,
  unauthenticatedPut,
  authenticatedDelete,
  Params,
  authenticatedPut,
} from 'src/services/apiService';
import React from 'react';
import useConfig from 'src/hooks/useConfig';
import urlJoin from 'url-join';

type ApiHook = {
  authGet: <T>(path: string, params?: Params) => Promise<T>;
  authPost: <T, B>(path: string, body: B) => Promise<T>;
  authPut: <T, B>(path: string, body: B) => Promise<T>;
  authDelete: <T>(path: string) => Promise<T>;
  unauthPost: <T, B>(path: string, body: B) => Promise<T>;
  unauthPut: <T, B>(path: string, body: B) => Promise<T>;
  authUrl: (path: string, params?: Params) => string;
};

export default function useApi(): ApiHook {
  const config = useConfig();
  const { apiToken } = React.useContext(AuthContext);

  const authGet = React.useCallback(
    <T>(path: string, params?: Params): Promise<T> => {
      if (!apiToken) {
        throw new Error('not logged in');
      }
      return authenticatedGet<T>(path, apiToken, params);
    },
    [apiToken],
  );

  const authPost = React.useCallback(
    <T, B>(path: string, body: B): Promise<T> => {
      if (!apiToken) {
        throw new Error('not logged in');
      }
      return authenticatedPost<T, B>(path, apiToken, body);
    },
    [apiToken],
  );

  const authPut = React.useCallback(
    <T, B>(path: string, body: B): Promise<T> => {
      if (!apiToken) {
        throw new Error('not logged in');
      }
      return authenticatedPut<T, B>(path, apiToken, body);
    },
    [apiToken],
  );

  const authDelete = React.useCallback(
    <T>(path: string): Promise<T> => {
      if (!apiToken) {
        throw new Error('not logged in');
      }
      return authenticatedDelete<T>(path, apiToken);
    },
    [apiToken],
  );

  const unauthPost = React.useCallback(<T, B>(path: string, body: B): Promise<T> => {
    return unauthenticatedPost<T, B>(path, body);
  }, []);

  const unauthPut = React.useCallback(<T, B>(path: string, body: B): Promise<T> => {
    return unauthenticatedPut<T, B>(path, body);
  }, []);

  const authUrl = React.useCallback(
    (path: string, params?: Params) => {
      if (!apiToken) {
        throw new Error('not logged in');
      }
      const queryStr = new URLSearchParams({
        ...params,
        token: apiToken,
      }).toString();
      return `${urlJoin(config.apiBaseUrl, path)}?${queryStr}`;
    },
    [apiToken, config.apiBaseUrl],
  );

  return {
    authGet,
    authPost,
    authPut,
    authDelete,
    unauthPost,
    unauthPut,
    authUrl,
  };
}
