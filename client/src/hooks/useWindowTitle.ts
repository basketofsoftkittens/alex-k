import { useTitle } from 'hookrouter';

const useWindowTitle = (prefix: string): void => {
  useTitle(`${prefix} - Time Logger`);
};

export default useWindowTitle;
