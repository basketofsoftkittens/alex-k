import LoginContainer, { Mode } from '../containers/LoginContainer';
import React from 'react';
import { HookRouter } from 'hookrouter';
import DashboardContainer from 'src/containers/DashboardContainer';
import HomeLoadContainer from 'src/containers/HomeLoadContainer';

const navToHomeLoad = (): JSX.Element => {
  return <HomeLoadContainer />;
};

const navToLogin = (): JSX.Element => {
  return <LoginContainer mode={Mode.LOGIN} />;
};

const navToRegister = (): JSX.Element => {
  return <LoginContainer mode={Mode.REGISTER} />;
};

const navToDashboard = (): JSX.Element => {
  return <DashboardContainer />;
};

const routes: HookRouter.RouteObject = {
  '/login': navToLogin,
  '/register': navToRegister,
  '/dashboard*': navToDashboard,
  '*': navToHomeLoad,
};

export default routes;
