import '@testing-library/jest-dom/vitest';

// toss.ts reads process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY at module load time
vi.stubEnv('NEXT_PUBLIC_TOSS_CLIENT_KEY', 'test-toss-client-key');

// business-verify/route.ts reads process.env.DATA_GO_KR_API_KEY at module load time
vi.stubEnv('DATA_GO_KR_API_KEY', 'test-data-go-kr-api-key');
