export type Config = {
  apiBaseUrl: string;
};

if (!process.env.REACT_APP_API_BASE_URL) {
  throw new Error('env must contain REACT_APP_API_BASE_URL');
}

const config: Config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
};

export default config;
