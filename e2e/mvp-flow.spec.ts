import { expect, test, type Page } from '@playwright/test';

const password = 'password123';

test('管理者と一般ユーザーが最小限のビジネスチャット操作を完了できる', async ({
  browser,
  page,
}) => {
  const suffix = Date.now();
  const adminEmail = `admin-${suffix}@example.com`;
  const memberEmail = `member-${suffix}@example.com`;
  const channelName = `general-${suffix}`;
  const memberMessage = `member message ${suffix}`;

  await signUpWithNewTenant(page, {
    displayName: '管理者ユーザー',
    email: adminEmail,
    password,
    tenantName: `テストテナント ${suffix}`,
  });

  await createChannel(page, channelName);
  const joinCode = await readJoinCode(page);
  await logout(page);

  await signUpWithJoinCode(page, {
    displayName: '一般ユーザー',
    email: memberEmail,
    password,
    joinCode,
  });

  await expect(
    page.getByRole('button', { name: 'チャンネルを作成' })
  ).not.toBeVisible();

  await page.getByRole('link', { name: channelName }).click();
  await expect(page.getByText(channelName)).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  try {
    await login(adminPage, adminEmail, password);
    await adminPage.getByRole('link', { name: channelName }).click();
    await expect(adminPage.getByText(channelName)).toBeVisible();

    await page.getByLabel('メッセージ本文').fill(memberMessage);
    await page.getByRole('button', { name: '投稿' }).click();

    await expect(page.getByText(memberMessage)).toBeVisible();
    await expect(adminPage.getByText(memberMessage)).toBeVisible();
  } finally {
    await adminContext.close();
  }

  await logout(page);
  await page.goto('/channels');
  await expect(page).toHaveURL(/\/login$/);
});

async function signUpWithNewTenant(
  page: Page,
  input: {
    displayName: string;
    email: string;
    password: string;
    tenantName: string;
  }
) {
  await page.goto('/signup');
  await page.getByLabel('ユーザー名').fill(input.displayName);
  await page.getByLabel('メールアドレス').fill(input.email);
  await page.getByLabel('パスワード').fill(input.password);
  await page.getByLabel('テナント名').fill(input.tenantName);
  await page.getByRole('button', { name: '登録' }).click();
  await expect(page).toHaveURL(/\/channels$/);
}

async function signUpWithJoinCode(
  page: Page,
  input: {
    displayName: string;
    email: string;
    password: string;
    joinCode: string;
  }
) {
  await page.goto('/signup');
  await page.getByLabel('既存テナントに参加する').click();
  await page.getByLabel('ユーザー名').fill(input.displayName);
  await page.getByLabel('メールアドレス').fill(input.email);
  await page.getByLabel('パスワード').fill(input.password);
  await page.getByLabel('参加コード').fill(input.joinCode);
  await page.getByRole('button', { name: '登録' }).click();
  await expect(page).toHaveURL(/\/channels$/);
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page).toHaveURL(/\/channels$/);
}

async function createChannel(page: Page, channelName: string) {
  await page.getByLabel('チャンネル名').fill(channelName);
  await page.getByLabel('チャンネル説明').fill('E2E テスト用チャンネル');
  await page.getByRole('button', { name: 'チャンネルを作成' }).click();
  await expect(page.getByRole('link', { name: channelName })).toBeVisible();
}

async function readJoinCode(page: Page): Promise<string> {
  await page.getByRole('link', { name: 'テナント情報' }).click();
  await expect(
    page.getByRole('heading', { name: 'テナント情報' })
  ).toBeVisible();

  const joinCode = await page
    .locator('dt', { hasText: '参加コード' })
    .locator('xpath=following-sibling::dd[1]')
    .textContent();

  expect(joinCode).toBeTruthy();
  return joinCode ?? '';
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'ログアウト' }).click();
  await expect(page).toHaveURL(/\/login$/);
}
