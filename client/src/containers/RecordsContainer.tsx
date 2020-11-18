import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import AddBoxIcon from '@material-ui/icons/AddBox';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { navigate, useQueryParams } from 'hookrouter';
import groupBy from 'lodash/groupBy';
import moment, { Duration } from 'moment';
import React from 'react';
import { AuthContext } from 'src/contexts/authContext';
import { SnackbarContext } from 'src/contexts/snackbarContext';
import useApi from 'src/hooks/useApi';
import ConfirmDialog from 'src/modals/ConfirmDialog';
import { Timelog } from 'src/models/timelogModel';
import { User, UserRole } from 'src/models/userModel';
import { TimelogsResponse, UsersResponse } from 'src/services/apiService';
import {
  formatDuration,
  formatForDisplay,
  sumDurations,
  formatForApi,
  parseFromDisplay,
} from 'src/services/chronoService';
import Button from '@material-ui/core/Button';
import { readTimelogResponse } from 'src/services/timelogService';
import AddRecordDialog from 'src/modals/AddRecordDialog';

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
  dailyHoursSatisfied: {
    backgroundColor: '#D8F9D8',
  },
  dailyHoursUnsatisfied: {
    backgroundColor: '#F9E3D8',
  },
  filterBar: {
    marginBottom: theme.spacing(3),
  },
  toDateSelector: {
    marginLeft: theme.spacing(1),
  },
  filterButton: {
    marginLeft: theme.spacing(2),
  },
  clearButton: {
    marginLeft: theme.spacing(1),
  },
  exportButton: {
    marginLeft: theme.spacing(1),
  },
  rowButton: {
    padding: 0,
    marginLeft: 0,
  },
}));

type UserDuration = {
  duration: Duration;
  userId: string;
};

const durationByUserAndDay = (timelogs: Timelog[]): { [key: string]: UserDuration } => {
  const groups = groupBy(timelogs, timelog => `${timelog.date.valueOf()}-${timelog.userId}`);
  return Object.keys(groups).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        userId: groups[key][0].userId,
        duration: sumDurations(groups[key].map(timelog => timelog.duration)),
      },
    }),
    {} as { [key: string]: UserDuration },
  );
};

const userCompletedForDay = (timelogs: Timelog[], users: User[]): { [key: string]: boolean } => {
  const usersById = groupBy(users, user => user.id);
  const userDays = durationByUserAndDay(timelogs);

  return Object.keys(userDays).reduce((acc, key) => {
    const { userId, duration } = userDays[key];
    const user = (usersById[userId] || [])[0];
    if (!user) {
      return acc;
    }
    return {
      ...acc,
      [key]: duration.asHours() >= (user.settings?.preferredDailyHours || 0),
    };
  }, {});
};

const RecordsContainer: React.FC = () => {
  const { user: authUser } = React.useContext(AuthContext);
  const classes = useStyles();
  const { authGet, authDelete, authUrl } = useApi();
  const [timelogs, setTimelogs] = React.useState<Timelog[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [queryParams, setQueryParams] = useQueryParams();
  const fromDateParam = queryParams['fromDate'];
  const toDateParam = queryParams['toDate'];
  const nowMoment = moment();
  const [refresh, setRefresh] = React.useState<number>(0);
  const [fromDate, setFromDate] = React.useState<Date | undefined>(parseFromDisplay(fromDateParam)?.toDate());
  const [toDate, setToDate] = React.useState<Date | undefined>(parseFromDisplay(toDateParam)?.toDate());
  const [deletingTimelog, setDeletingTimelog] = React.useState<Timelog | undefined>(undefined);
  const { showSnack } = React.useContext(SnackbarContext);
  const canSeeOthers = authUser?.role === UserRole.ADMIN;
  const usersCompleted = userCompletedForDay(timelogs, users);

  const loadTimelogs = React.useCallback(async () => {
    if (refresh) {
      // noop to convince eslint that we're using refresh
    }
    if (!authUser) {
      setTimelogs([]);
      setUsers([]);
      return;
    }
    if (createDialogOpen) {
      return;
    }
    const filterFrom = parseFromDisplay(fromDateParam);
    const filterTo = parseFromDisplay(toDateParam);
    const filter =
      !!filterFrom || !!filterTo
        ? {
            ...(filterFrom ? { fromDate: formatForApi(filterFrom) } : undefined),
            ...(filterTo ? { toDate: formatForApi(filterTo) } : undefined),
          }
        : undefined;
    const [timelogsResponse, usersResponse] = await Promise.all([
      authGet<TimelogsResponse>('timelogs', filter),
      authGet<UsersResponse>('users'),
    ]);
    const newTimelogs = timelogsResponse.timelogs.map(readTimelogResponse);
    setTimelogs(newTimelogs);
    setUsers(usersResponse.users);
  }, [authUser, authGet, fromDateParam, toDateParam, createDialogOpen, refresh]);

  React.useEffect(() => {
    loadTimelogs();
  }, [loadTimelogs]);

  if (!authUser) {
    return null;
  }

  return (
    <>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Grid container justify="space-between" alignItems="baseline" className={classes.filterBar}>
          <Grid item>
            <Grid container alignItems="baseline">
              <KeyboardDatePicker
                disableToolbar
                variant="dialog"
                format="yyyy.MM.dd"
                id="from-date"
                label="From"
                clearable
                maxDate={nowMoment.toDate()}
                value={fromDate || null}
                onChange={(value: Date | null) => setFromDate(value || undefined)}
                KeyboardButtonProps={{
                  'aria-label': 'change from date',
                }}
              />
              <KeyboardDatePicker
                disableToolbar
                variant="dialog"
                format="yyyy.MM.dd"
                id="to-date"
                label="To"
                clearable
                maxDate={nowMoment.toDate()}
                value={toDate || null}
                className={classes.toDateSelector}
                onChange={(value: Date | null) => setToDate(value || undefined)}
                KeyboardButtonProps={{
                  'aria-label': 'change to date',
                }}
              />
              <Button
                variant="contained"
                color="primary"
                className={classes.filterButton}
                disabled={!fromDate && !toDate}
                onClick={() => {
                  setQueryParams(
                    {
                      ...(fromDate ? { fromDate: formatForDisplay(fromDate) } : undefined),
                      ...(toDate ? { toDate: formatForDisplay(toDate) } : undefined),
                    },
                    true,
                  );
                }}
              >
                Filter
              </Button>
              {(!!fromDateParam || !!toDateParam) && (
                <Button
                  variant="outlined"
                  className={classes.clearButton}
                  onClick={() => {
                    setQueryParams({}, true);
                  }}
                >
                  Clear
                </Button>
              )}
            </Grid>
          </Grid>
          <Grid item>
            <Grid container alignItems="baseline" justify="flex-end">
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<AddBoxIcon />}
                  onClick={() => {
                    setCreateDialogOpen(true);
                  }}
                >
                  Add Record
                </Button>
              </Grid>
              {timelogs.length > 0 && (
                <Grid item>
                  <Link
                    className={classes.exportButton}
                    underline="none"
                    target="_blank"
                    href={authUrl('timelogs.html', {
                      ...(fromDate ? { fromDate: formatForApi(fromDate) } : undefined),
                      ...(toDate ? { toDate: formatForApi(toDate) } : undefined),
                    })}
                  >
                    <Button variant="outlined" style={{}} startIcon={<CloudDownloadIcon />}>
                      Export as HTML
                    </Button>
                  </Link>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </MuiPickersUtilsProvider>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell className={classes.boldText}>Date</TableCell>
              {canSeeOthers && <TableCell className={classes.boldText}>User Email</TableCell>}
              <TableCell className={classes.boldText}>Duration</TableCell>
              <TableCell className={classes.boldText}>Description</TableCell>
              <TableCell align="right">&nbsp;</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timelogs.map(timelog => (
              <TableRow
                key={timelog.id}
                className={
                  usersCompleted[`${timelog.date.valueOf()}-${timelog.userId}`]
                    ? classes.dailyHoursSatisfied
                    : classes.dailyHoursUnsatisfied
                }
              >
                <TableCell component="th" scope="row">
                  {formatForDisplay(timelog.date)}
                </TableCell>
                {canSeeOthers && (
                  <TableCell>
                    <Link
                      href="#"
                      onClick={(e: React.SyntheticEvent) => {
                        e.preventDefault();
                        navigate(`/dashboard/users/${timelog.userId}`);
                      }}
                    >
                      {timelog.userEmail}
                    </Link>
                  </TableCell>
                )}
                <TableCell>{formatDuration(timelog.duration)}</TableCell>
                <TableCell className={classes.wrappedCell}>{timelog.description}</TableCell>
                <TableCell align="right">
                  {(timelog.userId === authUser?.id || canSeeOthers) && (
                    <IconButton
                      color="inherit"
                      aria-label="edit time record"
                      edge="start"
                      className={classes.rowButton}
                      onClick={() => navigate(`/dashboard/records/${timelog.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {(timelog.userId === authUser?.id || canSeeOthers) && (
                    <IconButton
                      color="inherit"
                      aria-label="delete time record"
                      edge="start"
                      className={classes.rowButton}
                      onClick={() => setDeletingTimelog(timelog)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmDialog
        isOpen={!!deletingTimelog}
        hide={() => setDeletingTimelog(undefined)}
        acceptButtonText={'Permanently Delete'}
        declineButtonText={'Cancel'}
        title={'Delete Time Record'}
        onAccept={async () => {
          if (deletingTimelog) {
            try {
              await authDelete(`timelogs/timelog/${deletingTimelog.id}`);
              showSnack({
                severity: 'success',
                message: 'Time record deleted.',
              });
              setRefresh(n => n + 1);
            } catch (e) {
              console.error(e);
              showSnack({
                severity: 'error',
                message: 'Time record was not deleted.',
              });
            }
          }
        }}
      >
        {!!deletingTimelog && (
          <Typography>
            {'Do you want to delete this record of '}
            <span className={classes.boldText}>{formatDuration(deletingTimelog.duration)}</span>
            {' on '}
            <span className={classes.boldText}>{formatForDisplay(deletingTimelog.date)}</span>
            {'?'}
          </Typography>
        )}
      </ConfirmDialog>
      <AddRecordDialog
        isOpen={createDialogOpen}
        onCreate={() => {
          setCreateDialogOpen(false);
          setRefresh(n => n + 1);
        }}
        assignableUsers={users}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

export default RecordsContainer;
