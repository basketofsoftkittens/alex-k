import React from 'react';

type LocalStorageHook = [string | undefined, (v?: string) => void];

const useLocalStorage = (localStorageKey: string): LocalStorageHook => {
  const [value, setValue] = React.useState<string | undefined>(localStorage.getItem(localStorageKey) || undefined);

  React.useEffect(() => {
    if (value !== undefined) {
      localStorage.setItem(localStorageKey, value);
    } else {
      localStorage.removeItem(localStorageKey);
    }
  }, [value, localStorageKey]);

  return [value, setValue];
};

export default useLocalStorage;
