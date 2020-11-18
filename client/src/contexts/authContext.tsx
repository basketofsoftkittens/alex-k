import React from 'react';
import useLocalStorage from 'src/hooks/useLocalStorage';
import { unauthenticatedPost, authenticatedGet, unauthenticatedPut, UserResponse } from 'src/services/apiService';
import { User } from 'src/models/userModel';

type AuthContextValue = {
  isLoading: boolean;
  isLoggedIn: boolean;
  apiToken?: string;
  user?: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  refresh: () => void;
};

function noop() {
  // do nothing
}

const defaultContextValue: AuthContextValue = {
  isLoading: false,
  isLoggedIn: false,
  apiToken: undefined,
  user: undefined,
  login: () => Promise.resolve(),
  logout: noop,
  register: () => Promise.resolve(),
  refresh: noop,
};

export const AuthContext = React.createContext<AuthContextValue>(defaultContextValue);

type AuthContextProviderProps = {
  children?: React.ReactNode;
};

type LoginRegisterArgs = {
  email: string;
  password: string;
};

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({
  children,
}: AuthContextProviderProps): JSX.Element => {
  const [apiToken, setApiToken] = useLocalStorage('apiToken');
  const [user, setUser] = React.useState<User | undefined>(undefined);

  const login = async (email: string, password: string) => {
    const data = await unauthenticatedPost<UserResponse, LoginRegisterArgs>('auth/login', {
      email,
      password,
    });
    setUser(data);
    setApiToken(data.token);
  };

  const register = async (email: string, password: string) => {
    const data = await unauthenticatedPut<UserResponse, LoginRegisterArgs>('auth/register', {
      email,
      password,
    });
    setUser(data);
    setApiToken(data.token);
  };

  const logout = async () => {
    setApiToken(undefined);
    setUser(undefined);
  };

  const loadMe = React.useCallback(async () => {
    if (!apiToken) {
      return;
    }
    setUser(await authenticatedGet<User>('users/user', apiToken));
  }, [apiToken]);

  React.useEffect(() => {
    if (!apiToken && !user) {
      setUser(undefined);
    } else if (apiToken && !user) {
      loadMe();
    }
  }, [apiToken, user, loadMe]);

  return (
    <AuthContext.Provider
      value={{
        isLoading: !!apiToken && !user,
        isLoggedIn: !!user,
        apiToken,
        user,
        login,
        logout,
        register,
        refresh: () => loadMe(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
