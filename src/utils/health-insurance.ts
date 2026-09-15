const EXPIRING_SOON_THRESHOLD_DAYS = 30;

export function getHealthInsuranceStatus(
  hasHealthInsurance: boolean | null | undefined,
  endDate: string | null | undefined,
): 'Chưa có' | 'Còn hạn' | 'Sắp hết hạn' | 'Đã hết hạn' {
  if (!hasHealthInsurance || !endDate) {
    return 'Chưa có';
  }

  const today = new Date();
  const end = new Date(endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / msPerDay);

  if (daysUntilExpiry < 0) return 'Đã hết hạn';
  if (daysUntilExpiry <= EXPIRING_SOON_THRESHOLD_DAYS) return 'Sắp hết hạn';
  return 'Còn hạn';
}
