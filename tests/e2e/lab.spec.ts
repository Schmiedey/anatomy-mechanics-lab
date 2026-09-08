import { test, expect } from '@playwright/test';
test('atlas assets, controls, experiments and comparisons work together', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Elbow Flexion/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('slider', { name: 'Elbow angle', exact: true }),
  ).toHaveAttribute('aria-valuenow', '90');
  await page.getByRole('button', { name: '0°', exact: true }).click();
  await expect(page.locator('.torque-number')).toContainText('0.0');
  await page.getByRole('button', { name: '90°', exact: true }).click();
  await expect(page.locator('.torque-number')).toContainText('25.0');
  await expect(page.locator('.provenance-note')).toContainText(
    'not a validated human simulator',
  );
  await expect(
    page.locator('.torque-summary .mark-calculated').first(),
  ).toBeVisible();
  await expect(
    page.locator('.muscle-card').first().locator('.mark-estimated').first(),
  ).toBeVisible();
  await page
    .getByRole('spinbutton', { name: 'Forearm length', exact: true })
    .fill('36');
  await expect(page.locator('.torque-number')).toContainText('30.0');
  await page
    .getByRole('button', { name: 'Compare configurations', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save A', exact: true }).click();
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page
    .getByRole('spinbutton', { name: 'Forearm length', exact: true })
    .fill('30');
  await page.getByRole('button', { name: 'Run an experiment' }).click();
  await page.getByRole('button', { name: /Disable the biceps/ }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Biceps brachii', exact: true }),
  ).toHaveValue('0');
  await expect(
    page.locator('.muscle-card').first().locator('.muscle-force'),
  ).toContainText('0 N');
  await page
    .getByRole('button', { name: 'Compare configurations', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save B', exact: true }).click();
  await expect(
    page.locator('tbody tr').first().locator('td').last(),
  ).toContainText('-4.40');
  await page.getByRole('button', { name: 'Load', exact: true }).first().click();
  await expect(
    page.getByRole('spinbutton', { name: 'Forearm length', exact: true }),
  ).toHaveValue('36');
  await page
    .getByRole('button', { name: 'Reset all controls', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Inspect elbow joint', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Show full arm', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/elbow-joint.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Show full arm', exact: true })
    .click();
  await page.getByRole('button', { name: 'Anatomy', exact: true }).click();
  await page
    .getByRole('button', { name: 'Muscle forces', exact: true })
    .click();
  await page.getByRole('button', { name: 'Moment arms', exact: true }).click();
  await page
    .getByRole('button', { name: 'Advanced parameters', exact: true })
    .click();
  await page
    .getByRole('spinbutton', { name: 'Biceps insertion distance', exact: true })
    .fill('6.5');
  await page.getByRole('switch', { name: /Hill-type muscle capacity/ }).click();
  await expect(
    page.getByRole('spinbutton', {
      name: 'Prescribed flexion velocity',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('spinbutton', { name: 'Dumbbell weight', exact: true })
    .fill('100');
  await expect(page.locator('.equilibrium')).toContainText('torque deficit');
  await page.getByRole('button', { name: /Model notes/ }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'How to read the numbers',
  );
  await expect(page.getByRole('dialog')).toContainText('Calculated');
  await expect(page.getByRole('dialog')).toContainText('Assumed');
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Inspect calculations', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'torqueEquilibriumError',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page
    .getByRole('button', { name: 'Reset all controls', exact: true })
    .click();
  await page.getByRole('button', { name: '140°', exact: true }).click();
  await page.screenshot({
    path: 'test-results/flexion-140.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: '90°', exact: true }).click();
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(
    page.getByRole('slider', { name: 'Elbow angle', exact: true }),
  ).not.toHaveAttribute('aria-valuenow', '90');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await page
    .getByRole('button', { name: 'Reset all controls', exact: true })
    .click();
  await page.screenshot({
    path: 'test-results/lab-desktop.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test('mobile layout stays within the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  const size = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(size.page).toBeLessThanOrEqual(size.window);
  await page.screenshot({
    path: 'test-results/lab-mobile.png',
    fullPage: true,
  });
});
