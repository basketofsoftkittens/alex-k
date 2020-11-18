import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import RecordContainer from 'src/containers/RecordContainer';
import { Timelog } from 'src/models/timelogModel';
import { User } from 'src/models/userModel';

type AddRecordDialogProps = {
  isOpen: boolean;
  assignableUsers: User[];
  onCreate: (timelog: Timelog) => void;
  onClose: () => void;
};

const AddRecordDialog: React.FC<AddRecordDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
  assignableUsers,
}: AddRecordDialogProps) => {
  return (
    <Dialog onClose={() => onClose()} aria-labelledby="add-time-record" open={isOpen}>
      <DialogTitle id="add-time-record">Add Time Record</DialogTitle>
      <DialogContent dividers>
        <RecordContainer
          onCreate={(timelog: Timelog) => {
            onCreate(timelog);
          }}
          assignableUsers={assignableUsers}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddRecordDialog;
