import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import moment from 'moment';
import React from 'react';
import { AuthContext } from 'src/contexts/authContext';
import { DashboardContext } from 'src/contexts/dashboardContext';
import useApi from 'src/hooks/useApi';
import { UserRole, User } from 'src/models/userModel';
import { UserResponse } from 'src/services/apiService';
import { formatDuration } from 'src/services/chronoService';
import { SnackbarContext } from 'src/contexts/snackbarContext';

const useStyles = makeStyles(theme => ({
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  formInput: {
    marginTop: theme.spacing(1),
    marginLeft: 8,
    marginBottom: 8,
    marginRight: 8,
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

type UserContainerProps = {
  userId?: string | null;
  onCreate?: (user: User) => void;
};

type UpdateUserArgs = {
  email?: string;
  role?: UserRole;
  settings?: {
    preferredDailyHours: number;
  };
};

type CreateUserArgs = {
  email: string;
  password: string;
  role: UserRole;
};

const UserContainer: React.FC<UserContainerProps> = ({ userId, onCreate }: UserContainerProps) => {
  const classes = useStyles();
  const { user: authUser, refresh: refreshAuth } = React.useContext(AuthContext);
  const { user, setUser } = React.useContext(DashboardContext);
  const { showSnack } = React.useContext(SnackbarContext);
  const { authGet, authPost, authPut } = useApi();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [refresh, setRefresh] = React.useState<number>(0);
  const [email, setEmail] = React.useState<string | undefined>(undefined);
  const [password, setPassword] = React.useState<string | undefined>(undefined);
  const [role, setRole] = React.useState<UserRole | undefined>(undefined);
  const [preferredDailyHours, setPreferredDailyHours] = React.useState<number | undefined>(undefined);

  const isUnchanged =
    // do not check password, because blank/missing is valid
    (user ? email === undefined || email === user?.email : !email) &&
    (user ? role === undefined || role === user?.role : true) &&
    (preferredDailyHours === undefined || preferredDailyHours === user?.settings?.preferredDailyHours);

  const loadUser = React.useCallback(async () => {
    if (refresh) {
      // noop to convince eslint that we're using refresh
    }
    if (userId === null) {
      setUser(authUser);
    } else if (userId) {
      setUser(await authGet<UserResponse>(`users/user/${userId}`));
    } else {
      setUser(undefined);
    }
  }, [authUser, userId, authGet, setUser, refresh]);

  React.useEffect(() => {
    loadUser();
    return () => {
      setUser(undefined);
    };
  }, [loadUser, setUser]);

  const submit = React.useCallback(async () => {
    if (isUnchanged) {
      return;
    }

    setIsSaving(true);

    if (user) {
      // updating
      try {
        const args: UpdateUserArgs = {};
        if (email !== undefined && email !== user.email) {
          args.email = email;
        }
        if (role !== undefined && role !== user.role) {
          args.role = role;
        }
        if (
          preferredDailyHours !== undefined &&
          (preferredDailyHours !== user.settings?.preferredDailyHours || !user.settings?.preferredDailyHours)
        ) {
          args.settings = {
            preferredDailyHours,
          };
        }
        await authPost<UserResponse, UpdateUserArgs>(`users/user/${user.id}`, args);
        showSnack({
          severity: 'success',
          message: 'User updated.',
        });
        if (user.id === authUser?.id) {
          refreshAuth();
        } else {
          setRefresh(n => n + 1);
        }
      } catch (e) {
        console.error(e);
        showSnack({
          severity: 'error',
          message: 'User was not updated.',
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // creating
      try {
        const newUser = await authPut<UserResponse, CreateUserArgs>('users/user', {
          email: email || '', // there will always be one because submit is disabled otherwise
          password: password || '',
          role: role || UserRole.USER,
        });
        showSnack({
          severity: 'success',
          message: 'User added.',
        });
        if (onCreate) {
          onCreate(newUser);
        }
        setRefresh(n => n + 1);
      } catch (e) {
        console.error(e);
        showSnack({
          severity: 'error',
          message: 'User was not created.',
        });
      } finally {
        setIsSaving(false);
      }
    }
  }, [
    email,
    role,
    preferredDailyHours,
    authPost,
    isUnchanged,
    refreshAuth,
    showSnack,
    user,
    authUser,
    authPut,
    onCreate,
    password,
  ]);

  if (!authUser) {
    return <CircularProgress />;
  }

  if (![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    if (!user || user.id !== authUser.id) {
      return null;
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.paper}>
        <Grid container className={classes.form}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            disabled={isSaving}
            autoComplete="email"
            autoFocus
            className={classes.formInput}
            onChange={e => setEmail(e.target.value.trim())}
            value={email !== undefined ? email : user?.email || ''}
          />
          {!user && [UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role) && (
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="password"
              label="Password"
              name="password"
              disabled={isSaving}
              autoComplete="password"
              className={classes.formInput}
              onChange={e => setPassword(e.target.value)}
              value={password !== undefined ? password : ''}
            />
          )}
          {authUser.role && [UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role) && (
            <FormControl className={classes.formInput} variant="outlined" fullWidth>
              <InputLabel htmlFor="role">Role</InputLabel>
              <Select
                label="Role"
                id="role"
                value={role || user?.role || UserRole.USER}
                disabled={isSaving}
                onChange={e => setRole(e.target.value as UserRole)}
              >
                <MenuItem value={UserRole.USER}>User</MenuItem>
                <MenuItem value={UserRole.MANAGER}>Manager</MenuItem>
                {authUser.role === UserRole.ADMIN && <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>}
              </Select>
            </FormControl>
          )}
          {user && user?.id === authUser.id && (
            <FormControl className={classes.formInput} variant="outlined" fullWidth>
              <InputLabel htmlFor="preferredDailyHours">Preferred Daily Hours</InputLabel>
              <Select
                label="Preferred Daily Hours"
                id="preferredDailyHours"
                value={
                  (preferredDailyHours === undefined ? user.settings?.preferredDailyHours : preferredDailyHours) || 0
                }
                disabled={isSaving}
                onChange={e => {
                  const target = (e.target as unknown) as { value: number };
                  setPreferredDailyHours(target.value);
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12].map(n => (
                  <MenuItem key={`hours-${n}`} value={n}>
                    {n === 0 ? 'Any' : formatDuration(moment.duration(n, 'hours'))}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress /> : undefined}
            className={classes.submit}
            disabled={isSaving || isUnchanged}
            onClick={() => submit()}
          >
            {userId === undefined ? 'Add' : 'Save'}
          </Button>
        </Grid>
      </div>
    </Container>
  );
};

export default UserContainer;
