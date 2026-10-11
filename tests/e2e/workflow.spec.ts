import { test, expect } from '@playwright/test';
test('mobile workflow: manual check-in, ticket, duplicate prevention, verified check-out and persisted history', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Bãi xe Trung tâm', { exact: true })).toBeVisible();
  for (const title of ['Tổng quan', 'Quét biển số', 'Xe trong bãi', 'Lịch sử']) {
    const bounds = await page.getByText(title, { exact: true }).last().boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  }
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Quét xe vào', exact: true }).click();
  await page.getByPlaceholder('59-X1 123.45').last().fill('59-Z1 111.22');
  await page.getByRole('button', { name: 'Tiếp tục nhận xe' }).click();
  await page.getByRole('button', { name: 'Ô tô', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận nhận xe · Tạo vé' }).click();
  await expect(page.getByText('Đã ghi nhận xe vào bãi')).toBeVisible();
  await expect(page.getByText('59Z1-111.22', { exact: true }).last()).toBeVisible();
  await page.screenshot({ path: 'test-results/ticket-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Hoàn tất', exact: true }).click();
  await page.getByRole('button', { name: 'Quét xe vào', exact: true }).click();
  await page.getByPlaceholder('59-X1 123.45').last().fill('59Z111122');
  await page.getByRole('button', { name: 'Tiếp tục nhận xe' }).click();
  await page.getByRole('button', { name: 'Xác nhận nhận xe · Tạo vé' }).click();
  await expect(page.getByText(/Biển số này đã có xe đang gửi/)).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByText('Xe trong bãi', { exact: true }).last().click();
  await page.getByPlaceholder('Tìm biển số hoặc mã vé').fill('59Z1');
  await page.getByRole('button', { name: 'Xe 59Z1-111.22, Ô tô' }).click();
  await page.getByRole('button', { name: 'Làm thủ tục xe ra' }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận trả xe', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Đã kiểm tra thông tin xe và xác nhận trả xe' }).click();
  await page.getByRole('button', { name: 'Xác nhận trả xe', exact: true }).click();
  await expect(page.getByText('Đã hoàn tất lượt gửi xe', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã thu tiền mặt (demo)', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Về tổng quan' }).click();
  await page.reload();
  await expect(page.getByText('Bãi xe Trung tâm', { exact: true })).toBeVisible();
  await page.getByText('Lịch sử', { exact: true }).last().click();
  await page.getByPlaceholder('Tìm biển số hoặc mã vé').fill('59Z1');
  await expect(page.getByText('59Z1-111.22', { exact: true }).last()).toBeVisible();
  await page.screenshot({ path: 'test-results/history-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('demo recognition preserves manual edits; persisted capacity blocks new check-in', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Bãi xe Trung tâm', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cài đặt bãi xe' }).click();
  await page.getByRole('textbox', { name: 'Sức chứa tối đa (xe)' }).fill('1');
  await page.getByRole('button', { name: 'Lưu cài đặt', exact: true }).click();
  await expect(page.getByText('Đã lưu cấu hình bãi xe.')).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: 'Quét xe vào', exact: true }).click();
  await page.getByPlaceholder('59-X1 123.45').last().fill('59-Z2 333.44');
  await page.getByRole('button', { name: '51F-678.90', exact: true }).click();
  await page.getByRole('button', { name: 'Nhận diện mô phỏng', exact: true }).click();
  await expect(page.getByPlaceholder('59-X1 123.45').last()).toHaveValue('59-Z2 333.44');
  await expect(page.getByText(/Nhận diện mô phỏng — vui lòng đối chiếu/)).toBeVisible();
  await page.screenshot({ path: 'test-results/scanner-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Tiếp tục nhận xe' }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận nhận xe · Tạo vé' })).toBeDisabled();
  await expect(page.getByText('Bãi xe đã đầy', { exact: false }).last()).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: 'Cài đặt bãi xe' }).click();
  await expect(page.getByRole('textbox', { name: 'Sức chứa tối đa (xe)' })).toHaveValue('1');
  await page.getByRole('button', { name: 'Đặt lại dữ liệu demo' }).click();
  await expect(page.getByText('Đặt lại toàn bộ dữ liệu?')).toBeVisible();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByText('Đặt lại toàn bộ dữ liệu?')).not.toBeVisible();
});
