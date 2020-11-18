import React from 'react';
import { AuthContext } from 'src/contexts/authContext';
import { navigate } from 'hookrouter';
import CircularProgress from '@material-ui/core/CircularProgress';

const HomeLoadContainer: React.FC = (): JSX.Element => {
  const { isLoggedIn } = React.useContext(AuthContext);

  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn]);

  return <CircularProgress />;
};

export default HomeLoadContainer;
