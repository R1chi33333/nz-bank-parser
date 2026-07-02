import { expect, test } from '@playwright/test';

test('loading a sample renders the parsed transaction table', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'ANZ', exact: true }).click();

  const results = page.locator('main > section').nth(1);
  await expect(results.getByText('ANZ', { exact: true })).toBeVisible();
  await expect(results.getByText('detected')).toBeVisible();
  await expect(page.getByText('5 transactions')).toBeVisible();

  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText('2026-05-14');
  await expect(rows.first()).toContainText('COUNTDOWN AUCKLAND');
  await expect(rows.first()).toContainText('$45.67');
});

test('pasting an unknown CSV shows the unrecognised state', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('Or paste CSV content here').fill('Foo,Bar\n1,2\n');

  await expect(page.getByText('This does not look like a known bank export.')).toBeVisible();
  await expect(page.locator('table')).toHaveCount(0);
});

test('pasting a file with bad rows shows the error panel alongside results', async ({ page }) => {
  await page.goto('/');

  const csv = [
    'Date,Amount,Other Party,Description,Reference,Particulars,Analysis Code',
    '14/05/2026,-92.30,PAK N SAVE ROYAL OAK,EFTPOS TRANSACTION,,,',
    '32/05/2026,-5.00,BAD DATE,EFTPOS,,,',
  ].join('\n');
  await page.getByPlaceholder('Or paste CSV content here').fill(csv);

  const results = page.locator('main > section').nth(1);
  await expect(results.getByText('Westpac', { exact: true })).toBeVisible();
  await expect(page.getByText('1 row could not be parsed')).toBeVisible();
  await expect(page.getByText('[invalid-date]')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
});
