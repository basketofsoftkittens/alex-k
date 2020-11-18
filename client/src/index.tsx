import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { AuthContextProvider } from './contexts/authContext';
import { DashboardContextProvider } from './contexts/dashboardContext';
import CssBaseline from '@material-ui/core/CssBaseline';
import { SnackbarContextProvider } from './contexts/snackbarContext';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme();

ReactDOM.render(
  // TODO: after hookrouter updated to 2.x, we can use strict mode again without causing routing to hang
  // see https://github.com/Paratron/hookrouter/issues/121
  // <React.StrictMode>
  <MuiThemeProvider theme={theme}>
    <>
      <CssBaseline />
      <AuthContextProvider>
        <DashboardContextProvider>
          <SnackbarContextProvider>
            <App />
          </SnackbarContextProvider>
        </DashboardContextProvider>
      </AuthContextProvider>
    </>
  </MuiThemeProvider>,
  // </React.StrictMode>
  document.getElementById('root'),
);
