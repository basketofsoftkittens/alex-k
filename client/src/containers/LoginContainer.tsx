import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { AuthContext } from 'src/contexts/authContext';
import CircularProgress from '@material-ui/core/CircularProgress';
import { navigate } from 'hookrouter';

export enum Mode {
  LOGIN = 'login',
  REGISTER = 'register',
}

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

type LoginContainerProps = {
  mode?: Mode;
};

const LoginContainer = ({ mode = Mode.LOGIN }: LoginContainerProps): JSX.Element => {
  const classes = useStyles();
  const { isLoading: isAuthLoading, isLoggedIn, login, register } = React.useContext(AuthContext);
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [loginFailed, setLoginFailed] = React.useState<boolean>(false);
  const validForm = !!email;

  const submit = React.useCallback(async () => {
    setLoginFailed(false);
    if (mode === Mode.LOGIN) {
      try {
        await login(email, password);
      } catch (e) {
        setLoginFailed(true);
      }
    } else {
      await register(email, password);
    }
  }, [email, login, mode, password, register, setLoginFailed]);

  React.useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isAuthLoading, isLoggedIn]);

  return (
    <Container component="main" maxWidth="xs">
      <form
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {mode === Mode.LOGIN ? 'Sign in' : 'Sign Up'}
          </Typography>
          <Grid container className={classes.form}>
            {loginFailed && <Typography color="secondary">Email or password was incorrect.</Typography>}
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              disabled={isAuthLoading || isLoggedIn}
              autoComplete="email"
              autoFocus
              onChange={e => setEmail(e.target.value.trim())}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              disabled={isAuthLoading || isLoggedIn}
              autoComplete="current-password"
              onChange={e => setPassword(e.target.value.trim())}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              startIcon={isAuthLoading ? <CircularProgress /> : undefined}
              className={classes.submit}
              disabled={isAuthLoading || isLoggedIn || !validForm}
            >
              {mode === Mode.LOGIN ? 'Sign In' : 'Register'}
            </Button>
            <Grid container>
              <Grid item xs />
              <Grid item>
                {!isAuthLoading && !isLoggedIn && (
                  <Link
                    variant="body2"
                    onClick={() => {
                      if (mode === Mode.LOGIN) {
                        navigate('/register', true);
                      } else {
                        navigate('/login', true);
                      }
                    }}
                  >
                    {mode === Mode.LOGIN ? "Don't have an account? Register" : 'Already have an account? Sign In'}
                  </Link>
                )}
              </Grid>
            </Grid>
          </Grid>
        </div>
      </form>
    </Container>
  );
};

export default LoginContainer;
