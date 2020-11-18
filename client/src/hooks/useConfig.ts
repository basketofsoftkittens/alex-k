import config, { Config } from 'src/services/configService';

const useConfig = (): Config => {
  return config;
};

export default useConfig;
