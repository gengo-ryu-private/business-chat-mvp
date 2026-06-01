import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    reporter: 'html',
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: [
            `PORT=${port}`,
            'NEXT_PUBLIC_FIREBASE_API_KEY=e2e-api-key',
            'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=127.0.0.1',
            'NEXT_PUBLIC_FIREBASE_PROJECT_ID=business-chat-mvp-e2e',
            'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=business-chat-mvp-e2e.appspot.com',
            'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789',
            'NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:e2e',
            'NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true',
            'FIREBASE_PROJECT_ID=business-chat-mvp-e2e',
            'FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099',
            'FIRESTORE_EMULATOR_HOST=127.0.0.1:8080',
            'npm run dev',
        ].join(' '),
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
