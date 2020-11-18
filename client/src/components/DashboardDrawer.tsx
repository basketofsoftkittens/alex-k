import CardMedia from '@material-ui/core/CardMedia';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import DateRangeIcon from '@material-ui/icons/DateRange';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PeopleIcon from '@material-ui/icons/People';
import { navigate } from 'hookrouter';
import React from 'react';
import { AuthContext } from 'src/contexts/authContext';
import LogoImage from 'src/images/logo239.png';
import { UserRole } from 'src/models/userModel';
import { DashboardFocus, DashboardTab } from 'src/routes/dashboardRoutes';
import ConfirmDialog from 'src/modals/ConfirmDialog';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  // necessary for content to be below app bar
  toolbar: {
    ...theme.mixins.toolbar,
    backgroundImage: LogoImage,
  },
}));

type DashboardDrawerProps = {
  focus?: DashboardFocus;
};

const DashboardDrawer: React.FC<DashboardDrawerProps> = ({ focus }: DashboardDrawerProps) => {
  const classes = useStyles();
  const { user, logout } = React.useContext(AuthContext);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState<boolean>(false);

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className={classes.toolbar}>
        <CardMedia component="img" alt="Time Logger Logo" height="64" image={LogoImage} title="Time Logger Logo" />
      </div>
      <Divider />
      <List>
        <ListItem
          button
          key={'records'}
          selected={focus?.tab === DashboardTab.RECORDS}
          onClick={() => (focus?.tab === DashboardTab.RECORDS ? undefined : navigate('/dashboard/records'))}
        >
          <ListItemIcon>
            <DateRangeIcon />
          </ListItemIcon>
          <ListItemText primary={'Time Records'} />
        </ListItem>
        {[UserRole.MANAGER, UserRole.ADMIN].includes(user?.role) && (
          <ListItem
            button
            key={'users'}
            selected={focus?.tab === DashboardTab.USERS}
            onClick={() => (focus?.tab === DashboardTab.USERS ? undefined : navigate('/dashboard/users'))}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary={'Users'} />
          </ListItem>
        )}
      </List>
      <Divider />
      <List>
        <ListItem
          button
          key={'profile'}
          selected={focus?.tab === DashboardTab.PROFILE}
          onClick={() => (focus?.tab === DashboardTab.PROFILE ? undefined : navigate('/dashboard/profile'))}
        >
          <ListItemIcon>
            <AccountBoxIcon />
          </ListItemIcon>
          <ListItemText primary={'Profile'} />
        </ListItem>
        <ListItem button key={'logout'} onClick={() => setLogoutDialogOpen(true)}>
          <ListItemIcon>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary={'Log Out'} />
        </ListItem>
      </List>
      <ConfirmDialog
        isOpen={logoutDialogOpen}
        hide={() => setLogoutDialogOpen(false)}
        acceptButtonText={'Log Out'}
        declineButtonText={'Cancel'}
        title={'Log Out'}
        onAccept={async () => logout()}
      >
        <Typography>Do you want to log out?</Typography>
      </ConfirmDialog>
    </div>
  );
};

export default DashboardDrawer;
