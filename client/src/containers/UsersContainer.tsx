import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import EditIcon from '@material-ui/icons/Edit';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { navigate } from 'hookrouter';
import React from 'react';
import { AuthContext } from 'src/contexts/authContext';
import DeleteIcon from '@material-ui/icons/Delete';
import useApi from 'src/hooks/useApi';
import { User, UserRole } from 'src/models/userModel';
import { UsersResponse } from 'src/services/apiService';
import Typography from '@material-ui/core/Typography';
import { SnackbarContext } from 'src/contexts/snackbarContext';
import ConfirmDialog from 'src/modals/ConfirmDialog';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import AddUserDialog from 'src/modals/AddUserDialog';

const useStyles = makeStyles(theme => ({
  table: {
    width: '100%',
  },
  wrappedCell: {
    whiteSpace: 'normal',
    wordWrap: 'break-word',
  },
  boldText: {
    fontWeight: 'bold',
  },
  filterBar: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  rowButton: {
    padding: 0,
    marginLeft: 0,
  },
}));

const roleLabels: { [k: string]: string } = {
  [UserRole.USER]: 'User',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.ADMIN]: 'Admin',
};

const UsersContainer: React.FC = () => {
  const { user: authUser } = React.useContext(AuthContext);
  const classes = useStyles();
  const { authGet, authDelete } = useApi();
  const [users, setUsers] = React.useState<User[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [refresh, setRefresh] = React.useState<number>(0);
  const [deletingUser, setDeletingUser] = React.useState<User | undefined>(undefined);
  const { showSnack } = React.useContext(SnackbarContext);

  const loadUsers = React.useCallback(async () => {
    if (refresh) {
      // noop to convince eslint that we're using refresh
    }
    if (!authUser) {
      setUsers([]);
      return;
    }
    const response = await authGet<UsersResponse>('users');
    setUsers(response.users);
  }, [authGet, authUser, refresh]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!authUser || ![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    return null;
  }

  return (
    <>
      <Grid container justify="flex-end" alignItems="baseline" className={classes.filterBar}>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<AddBoxIcon />}
            onClick={() => {
              setCreateDialogOpen(true);
            }}
          >
            Add User
          </Button>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell className={classes.boldText}>Email</TableCell>
              <TableCell className={classes.boldText}>Role</TableCell>
              <TableCell align="right" className={classes.boldText}>
                &nbsp;
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell component="th" scope="row">
                  {user.email}
                </TableCell>
                <TableCell>{roleLabels[user.role]}</TableCell>
                <TableCell align="right">
                  {
                    <IconButton
                      color="inherit"
                      aria-label="edit user"
                      edge="start"
                      className={classes.rowButton}
                      onClick={() => navigate(`/dashboard/users/${user.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                  }
                  <IconButton
                    color="inherit"
                    aria-label="delete user"
                    edge="start"
                    className={classes.rowButton}
                    onClick={() => setDeletingUser(user)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmDialog
        isOpen={!!deletingUser}
        hide={() => setDeletingUser(undefined)}
        acceptButtonText={'Permanently Delete'}
        declineButtonText={'Cancel'}
        title={'Delete User'}
        onAccept={async () => {
          if (deletingUser) {
            try {
              await authDelete(`users/user/${deletingUser.id}`);
              showSnack({
                severity: 'success',
                message: 'User deleted.',
              });
              setRefresh(n => n + 1);
            } catch (e) {
              console.error(e);
              showSnack({
                severity: 'error',
                message: 'User was not deleted.',
              });
            }
          }
        }}
      >
        {!!deletingUser && authUser.id === deletingUser.id && (
          <Typography>
            {'Do you want to delete '}
            <span className={classes.boldText}>YOURSELF</span>
            {' AND ALL your associated time records?'}
          </Typography>
        )}
        {!!deletingUser && authUser.id !== deletingUser.id && (
          <Typography>
            {'Do you want to delete this user '}
            <span className={classes.boldText}>{deletingUser.email}</span>
            {' AND ALL their associated time records?'}
          </Typography>
        )}
      </ConfirmDialog>
      <AddUserDialog
        isOpen={createDialogOpen}
        onCreate={() => {
          setCreateDialogOpen(false);
          setRefresh(n => n + 1);
        }}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

export default UsersContainer;
