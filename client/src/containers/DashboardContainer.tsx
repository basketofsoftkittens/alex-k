import AppBar from '@material-ui/core/AppBar';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import MenuIcon from '@material-ui/icons/Menu';
import { navigate, useRoutes } from 'hookrouter';
import React from 'react';
import DashboardDrawer from 'src/components/DashboardDrawer';
import { DashboardContext } from 'src/contexts/dashboardContext';
import LogoImage from 'src/images/logo239.png';
import { User } from 'src/models/userModel';
import dashboardRoutes, { DashboardFocus, DashboardTab } from 'src/routes/dashboardRoutes';
import { Timelog } from 'src/models/timelogModel';
import { formatForDisplay } from 'src/services/chronoService';
import Link from '@material-ui/core/Link';
import useWindowTitle from 'src/hooks/useWindowTitle';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  upButton: {
    marginRight: theme.spacing(2),
  },
  // necessary for content to be below app bar
  toolbar: {
    ...theme.mixins.toolbar,
    backgroundImage: LogoImage,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  caretIcon: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  underlined: {
    textDecoration: 'underline',
  },
}));

const heading = (focus?: DashboardFocus, singleLog?: Timelog, singleUser?: User): string => {
  if (focus?.tab === DashboardTab.RECORDS) {
    return singleLog ? `Time Record on ${formatForDisplay(singleLog.date)}` : 'Time Records';
  }
  if (focus?.tab === DashboardTab.PROFILE) {
    return 'Profile and Settings';
  }
  if (focus?.tab === DashboardTab.USERS) {
    return singleUser ? `User ${singleUser.email}` : 'Users';
  }
  return '';
};

const DashboardContainer: React.FC = () => {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const { user: singleUser, timelog: singleTimelog } = React.useContext(DashboardContext);
  const routeResult = useRoutes(dashboardRoutes) as DashboardFocus | null;

  const headingStr = heading(routeResult || undefined, singleTimelog, singleUser);
  useWindowTitle(headingStr);

  const drawer = <DashboardDrawer focus={routeResult || undefined} />;

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          {routeResult?.parentRoute ? (
            <Typography variant="h6" noWrap>
              <Link
                color="inherit"
                href="#"
                className={classes.underlined}
                onClick={(e: React.SyntheticEvent) => {
                  e.preventDefault();
                  if (routeResult.parentRoute) {
                    navigate(routeResult.parentRoute);
                  }
                }}
              >
                {routeResult.parentRouteName}
              </Link>
            </Typography>
          ) : undefined}
          {routeResult?.parentRoute ? (
            <div className={classes.caretIcon}>
              <ArrowForwardIosIcon />
            </div>
          ) : undefined}
          <Typography variant="h6" noWrap>
            {headingStr}
          </Typography>
        </Toolbar>
      </AppBar>
      <nav className={classes.drawer} aria-label="mailbox folders">
        <Hidden smUp>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true,
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown>
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        {routeResult?.children}
      </main>
    </div>
  );
};

export default DashboardContainer;
