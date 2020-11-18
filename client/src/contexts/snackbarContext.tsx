import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import { Color } from '@material-ui/lab/Alert';
import moment, { Duration } from 'moment';
import Alert from '@material-ui/lab/Alert';

export type Snack = {
  severity: Color;
  message: string;
  duration?: Duration;
};

type SnackbarContextValue = {
  snack?: Snack;
  showSnack: (snack: Snack) => void;
};

function noop() {
  // do nothihg
}

const defaultContextValue: SnackbarContextValue = {
  snack: undefined,
  showSnack: noop,
};

export const SnackbarContext = React.createContext<SnackbarContextValue>(defaultContextValue);

type SnackbarContextProviderProps = {
  children?: React.ReactNode;
};

export const SnackbarContextProvider: React.FC<SnackbarContextProviderProps> = ({
  children,
}: SnackbarContextProviderProps): JSX.Element => {
  const [snack, setSnack] = React.useState<Snack | undefined>(defaultContextValue.snack);
  const [open, setOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (snack) {
      setOpen(true);
      const timeout = setTimeout(() => {
        setOpen(false);
      }, (snack.duration || moment.duration(3, 'seconds')).asMilliseconds());
      return () => {
        clearTimeout(timeout);
        setOpen(false);
      };
    }
  }, [snack]);

  return (
    <SnackbarContext.Provider
      value={{
        showSnack: snack => setSnack(snack),
      }}
    >
      {children}
      {snack && (
        <Snackbar open={open}>
          <Alert severity={snack.severity}>{snack.message}</Alert>
        </Snackbar>
      )}
    </SnackbarContext.Provider>
  );
};
