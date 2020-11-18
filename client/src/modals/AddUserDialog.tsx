import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import UserContainer from 'src/containers/UserContainer';
import { User } from 'src/models/userModel';

type AddUserDialogProps = {
  isOpen: boolean;
  onCreate: (user: User) => void;
  onClose: () => void;
};

const AddUserDialog: React.FC<AddUserDialogProps> = ({ isOpen, onClose, onCreate }: AddUserDialogProps) => {
  return (
    <Dialog onClose={() => onClose()} aria-labelledby="add-user" open={isOpen}>
      <DialogTitle id="add-user">Add User</DialogTitle>
      <DialogContent dividers>
        <UserContainer
          onCreate={(user: User) => {
            onCreate(user);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
