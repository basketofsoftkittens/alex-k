import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button, { ButtonProps } from '@material-ui/core/Button';
import React from 'react';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';

type ConfirmDialogProps = {
  isOpen: boolean;
  hide: () => void;
  title: React.ReactNode;
  acceptButtonText?: React.ReactNode;
  declineButtonText?: React.ReactNode;
  onAccept?: () => Promise<void>;
  onDecline?: () => Promise<void>;
  onClose?: () => void;
  children?: React.ReactNode;
  acceptButtonProps?: ButtonProps;
  declineButtonProps?: ButtonProps;
  acceptingButtonProps?: ButtonProps;
  decliningButtonProps?: ButtonProps;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  hide,
  title,
  acceptButtonText,
  declineButtonText,
  children,
  onAccept,
  onDecline,
  onClose,
  acceptButtonProps,
  declineButtonProps,
  acceptingButtonProps,
  decliningButtonProps,
}: ConfirmDialogProps) => {
  const [isAccepting, setIsAccepting] = React.useState<boolean>(false);
  const [isDeclining, setIsDeclining] = React.useState<boolean>(false);

  const doAccept = React.useCallback(async () => {
    setIsAccepting(true);
    if (onAccept) {
      try {
        await onAccept();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsAccepting(false);
    hide();
  }, [onAccept, hide]);

  const doDecline = React.useCallback(async () => {
    setIsDeclining(true);
    if (onDecline) {
      try {
        await onDecline();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsDeclining(false);
    hide();
  }, [onDecline, hide]);

  let declineProps = isDeclining ? decliningButtonProps : declineButtonProps;
  if (!declineProps && isDeclining) {
    declineProps = { ...declineButtonProps, startIcon: <CircularProgress /> };
  }

  let acceptProps = isAccepting ? acceptingButtonProps : acceptButtonProps;
  if (!acceptProps && isAccepting) {
    acceptProps = { ...acceptButtonProps, startIcon: <CircularProgress /> };
  }

  return (
    <Dialog onClose={() => (onClose ? onClose() : undefined)} aria-labelledby="confirm" open={isOpen}>
      <DialogTitle id="confirm">{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        {!!declineButtonText && (
          <Button
            autoFocus
            onClick={() => doDecline()}
            color="primary"
            disabled={isAccepting || isDeclining}
            {...declineProps}
          >
            {declineButtonText}
          </Button>
        )}
        {!!acceptButtonText && (
          <Button onClick={() => doAccept()} color="secondary" disabled={isAccepting || isDeclining} {...acceptProps}>
            {acceptButtonText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
