import DateFnsUtils from '@date-io/date-fns';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment, { Moment, Duration } from 'moment';
import React from 'react';
import { AuthContext } from 'src/contexts/authContext';
import { DashboardContext } from 'src/contexts/dashboardContext';
import { SnackbarContext } from 'src/contexts/snackbarContext';
import useApi from 'src/hooks/useApi';
import { TimelogResponse, UsersResponse } from 'src/services/apiService';
import { formatForApi } from 'src/services/chronoService';
import { Timelog } from 'src/models/timelogModel';
import { readTimelogResponse } from 'src/services/timelogService';
import { UserRole, User } from 'src/models/userModel';
import Autocomplete from '@material-ui/lab/Autocomplete';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import find from 'lodash/find';

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

type RecordContainerProps = {
  logId?: string;
  onCreate?: (timelog: Timelog) => void;
  assignableUsers?: User[];
};

type UpdateTimelogArgs = {
  userId?: string;
  date?: string;
  description?: string;
  minutes?: number;
};

type CreateTimelogArgs = {
  userId: string;
  description: string;
  date: string;
  minutes: number;
};

function isDateUnchanged(date?: Moment, reference?: Moment) {
  return date === undefined || date.unix() === reference?.unix();
}

function isDescriptionUnchanged(description?: string, reference?: string) {
  return description === undefined || description.trim() === reference?.trim();
}

function isEmailUnchanged(email?: string, reference?: string) {
  return email === undefined || email === reference;
}

function isDurationUnchanged(hours?: number, minutes?: number, reference?: Duration) {
  if (hours !== undefined) {
    if (hours !== Math.max(0, Math.floor(reference?.asHours() || 0))) {
      return false;
    }
  }
  if (minutes !== undefined) {
    if (minutes !== Math.max(0, reference?.minutes() || 0)) {
      return false;
    }
  }
  return true;
}

const RecordContainer: React.FC<RecordContainerProps> = ({
  logId,
  onCreate,
  assignableUsers: assignableUsersOrRequested,
}: RecordContainerProps) => {
  const classes = useStyles();
  const { user: authUser } = React.useContext(AuthContext);
  const { timelog, setTimelog } = React.useContext(DashboardContext);
  const { showSnack } = React.useContext(SnackbarContext);
  const { authGet, authPost, authPut } = useApi();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [userEmail, setUserEmail] = React.useState<string | undefined>(undefined);
  const [date, setDate] = React.useState<Moment | undefined>(undefined);
  const [description, setDescription] = React.useState<string | undefined>(undefined);
  const [hours, setHours] = React.useState<number | undefined>(undefined);
  const [minutes, setMinutes] = React.useState<number | undefined>(undefined);
  const [refresh, setRefresh] = React.useState<number>(0);
  const nowMoment = moment();
  const dateForApi = date ? formatForApi(date) : undefined; // react hooks hack
  const [assignableUsers, setAssignableUsers] = React.useState<User[] | undefined>(assignableUsersOrRequested);

  const isUnchanged =
    isEmailUnchanged(userEmail, timelog?.userEmail) &&
    isDateUnchanged(date, timelog?.date) &&
    isDescriptionUnchanged(description, timelog?.description) &&
    isDurationUnchanged(hours, minutes, timelog?.duration);

  const loadLog = React.useCallback(async () => {
    if (refresh) {
      // noop to convince eslint that we're using refresh
    }
    if (logId) {
      const rawTimelog = await authGet<TimelogResponse>(`timelogs/timelog/${logId}`);
      const log = readTimelogResponse(rawTimelog);
      setTimelog(log);
      setHours(Math.floor(log.duration.asHours() || 0));
      setMinutes(log.duration.minutes());
    } else {
      setTimelog(undefined);
    }
  }, [logId, authGet, setTimelog, refresh]);

  const loadUsers = React.useCallback(async () => {
    if (refresh) {
      // noop to convince eslint that we're using refresh
    }
    if (assignableUsers === undefined) {
      const response = await authGet<UsersResponse>('users');
      setAssignableUsers(response.users);
    }
  }, [assignableUsers, setAssignableUsers, authGet, refresh]);

  React.useEffect(() => {
    loadLog();
    return () => {
      setTimelog(undefined);
    };
  }, [loadLog, setTimelog]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const submit = React.useCallback(async () => {
    setIsSaving(true);

    if (timelog) {
      // updating
      try {
        const args: UpdateTimelogArgs = {};
        if (userEmail && !isEmailUnchanged(userEmail, timelog.userEmail)) {
          const matchingUser = find(assignableUsers, u => u.email === userEmail);
          if (matchingUser) {
            args.userId = matchingUser.id;
          }
        }
        if (dateForApi && dateForApi !== formatForApi(timelog.date)) {
          args.date = dateForApi;
        }
        if (description && !isDescriptionUnchanged(description, timelog.description)) {
          args.description = description;
        }
        if (hours !== undefined && minutes !== undefined && !isDurationUnchanged(hours, minutes, timelog.duration)) {
          args.minutes = moment
            .duration(hours || 0, 'hours')
            .add(moment.duration(minutes || 0, 'minutes'))
            .asMinutes();
        }
        await authPost<TimelogResponse, UpdateTimelogArgs>(`timelogs/timelog/${timelog.id}`, args);
        showSnack({
          severity: 'success',
          message: 'Time record updated.',
        });
        setRefresh(n => n + 1);
      } catch (e) {
        console.error(e);
        showSnack({
          severity: 'error',
          message: 'Time record was not updated.',
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // creating
      try {
        const args: CreateTimelogArgs = {
          userId: authUser?.id || '',
          date: dateForApi || formatForApi(moment()),
          description: description || '',
          minutes: moment
            .duration(hours || 0, 'hours')
            .add(moment.duration(minutes || 0, 'minutes'))
            .asMinutes(),
        };
        if (userEmail) {
          const matchingUser = find(assignableUsers, u => u.email === userEmail);
          if (matchingUser) {
            args.userId = matchingUser.id;
          }
        }

        const response = await authPut<TimelogResponse, CreateTimelogArgs>('timelogs/timelog', args);
        showSnack({
          severity: 'success',
          message: 'Time record added.',
        });
        if (onCreate) {
          onCreate(readTimelogResponse(response));
        }
        setRefresh(n => n + 1);
      } catch (e) {
        console.error(e);
        showSnack({
          severity: 'error',
          message: 'Time record was not created.',
        });
      } finally {
        setIsSaving(false);
      }
    }
  }, [
    dateForApi,
    description,
    hours,
    minutes,
    authPost,
    showSnack,
    timelog,
    onCreate,
    authPut,
    assignableUsers,
    userEmail,
    authUser,
  ]);

  if (!authUser) {
    return <CircularProgress />;
  }

  if (timelog && timelog.userId !== authUser.id && authUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <Container component="main" maxWidth="sm">
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className={classes.paper}>
          <Grid container className={classes.form} alignItems="baseline">
            {authUser.role === UserRole.ADMIN && (
              // does NOT work when option type is User
              // because of bug in Autocomplete re: controlled/uncontrolled distinction
              // when setting the initial/default/literal value
              // so, going with a string type instead, which can have a valid empty value of ''
              <Autocomplete<string, false, true, false>
                id="assigned-user"
                fullWidth
                className={classes.formInput}
                options={(assignableUsers || []).map(u => u.email)}
                filterSelectedOptions
                multiple={false}
                freeSolo={false}
                disableClearable
                getOptionLabel={email => email}
                value={userEmail !== undefined ? userEmail : timelog?.userEmail || authUser.email}
                onChange={(_e, email: string) => setUserEmail(email || undefined)}
                renderInput={params => (
                  <TextField {...params} label="Assigned User" variant="outlined" margin="normal" />
                )}
                renderOption={(email, { inputValue }) => {
                  const matches = match(email, inputValue);
                  const parts = parse(email, matches);
                  return (
                    <div>
                      {parts.map((part, index) => (
                        <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                          {part.text}
                        </span>
                      ))}
                    </div>
                  );
                }}
              />
            )}
            <KeyboardDatePicker
              disableToolbar
              variant="dialog"
              format="yyyy.MM.dd"
              id="date"
              label="Date"
              fullWidth
              required={!timelog}
              disabled={isSaving}
              className={classes.formInput}
              maxDate={nowMoment.toDate()}
              value={date?.toDate() || timelog?.date.toDate() || nowMoment.toDate()}
              onChange={(value: Date | null) => setDate(moment(value).startOf('day') || undefined)}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              id="hours"
              label="Hours"
              name="hours"
              type="number"
              disabled={isSaving}
              className={classes.formInput}
              onChange={e => {
                const newValue = Math.max(0, parseFloat(e.target.value.trim()));
                // handle a number vs NaN vs 0
                setHours(newValue === 0 ? newValue : newValue || undefined);
              }}
              value={hours || ''}
            />
            <TextField
              variant="outlined"
              margin="normal"
              id="minutes"
              label="Minutes"
              name="minutes"
              type="number"
              disabled={isSaving}
              className={classes.formInput}
              onChange={e => {
                const newValue = Math.max(0, parseFloat(e.target.value.trim()));
                // handle a number vs NaN vs 0
                setMinutes(newValue === 0 ? newValue : newValue || undefined);
              }}
              value={minutes || ''}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              disabled={isSaving}
              autoFocus
              className={classes.formInput}
              onChange={e => setDescription(e.target.value)}
              value={description !== undefined ? description : timelog?.description || ''}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              startIcon={isSaving ? <CircularProgress /> : undefined}
              className={classes.submit}
              disabled={isSaving || (timelog && isUnchanged)}
              onClick={() => submit()}
            >
              {logId ? 'Save' : 'Add'}
            </Button>
          </Grid>
        </div>
      </MuiPickersUtilsProvider>
    </Container>
  );
};

export default RecordContainer;
