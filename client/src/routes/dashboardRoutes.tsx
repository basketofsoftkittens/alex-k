import { HookRouter } from 'hookrouter';
import RecordsContainer from 'src/containers/RecordsContainer';
import React from 'react';
import UsersContainer from 'src/containers/UsersContainer';
import UserContainer from 'src/containers/UserContainer';
import RecordContainer from 'src/containers/RecordContainer';

export enum DashboardTab {
  USERS = 'users',
  RECORDS = 'records',
  PROFILE = 'profile',
}

export type DashboardFocus = {
  tab: DashboardTab;
  children?: React.ReactNode;
  parentRoute?: string;
  parentRouteName?: string;
};

const navToUsersTabForUser = ({ id }: HookRouter.QueryParams): DashboardFocus => {
  return {
    tab: DashboardTab.USERS,
    children: <UserContainer userId={id} />,
    parentRoute: '/dashboard/users',
    parentRouteName: 'Users',
  };
};

const navToRecordsTabForLog = ({ id }: HookRouter.QueryParams): DashboardFocus => {
  return {
    tab: DashboardTab.RECORDS,
    children: <RecordContainer logId={id} />,
    parentRoute: '/dashboard/records',
    parentRouteName: 'Records',
  };
};

const navToRecordsTab = (): DashboardFocus => {
  return {
    tab: DashboardTab.RECORDS,
    children: <RecordsContainer />,
  };
};

const navToUsersTab = (): DashboardFocus => {
  return {
    tab: DashboardTab.USERS,
    children: <UsersContainer />,
  };
};

const navToProfileTab = (): DashboardFocus => {
  return {
    tab: DashboardTab.PROFILE,
    children: <UserContainer userId={null} />,
  };
};

const routes: HookRouter.RouteObject = {
  '/records': navToRecordsTab,
  '/records/:id': navToRecordsTabForLog,
  '/users': navToUsersTab,
  '/users/:id': navToUsersTabForUser,
  '/profile': navToProfileTab,
  '*': navToRecordsTab,
};

export default routes;
