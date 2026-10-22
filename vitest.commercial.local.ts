import config from './vitest.config';

// Local verification must not load .env files or contact providers.
export default { ...config, envDir: false as const };
