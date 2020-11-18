import { navigate, useRoutes } from 'hookrouter';
import React from 'react';
import { AuthContext } from './contexts/authContext';
import appRoutes from './routes/appRoutes';

function App() {
  const { isLoading: isAuthLoading, isLoggedIn } = React.useContext(AuthContext);
  const routeResult = useRoutes(appRoutes);

  React.useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isAuthLoading, isLoggedIn]);

  return routeResult || null;
}

export default App;
