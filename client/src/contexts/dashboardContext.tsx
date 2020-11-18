import React from 'react';
import { User } from 'src/models/userModel';
import { Timelog } from 'src/models/timelogModel';

type DashboardContextValue = {
  user?: User;
  setUser: (u?: User) => void;
  timelog?: Timelog;
  setTimelog: (t?: Timelog) => void;
};

function noop() {
  // do nothing
}

const defaultContextValue: DashboardContextValue = {
  user: undefined,
  setUser: noop,
  timelog: undefined,
  setTimelog: noop,
};

export const DashboardContext = React.createContext<DashboardContextValue>(defaultContextValue);

type DashboardContextProviderProps = {
  children?: React.ReactNode;
};

export const DashboardContextProvider: React.FC<DashboardContextProviderProps> = ({
  children,
}: DashboardContextProviderProps): JSX.Element => {
  const [user, setUser] = React.useState<User | undefined>(defaultContextValue.user);
  const [timelog, setTimelog] = React.useState<Timelog | undefined>(defaultContextValue.timelog);

  return (
    <DashboardContext.Provider
      value={{
        user,
        setUser,
        timelog,
        setTimelog,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
