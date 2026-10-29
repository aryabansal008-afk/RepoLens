export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
}

export function formatFull(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('en').format(number);
}

export function formatBytes(bytes) {
  const number = Number(bytes);
  if (!Number.isFinite(number)) return '—';
  if (number < 1024) return `${formatFull(number)} B`;
  if (number < 1024 * 1024) return `${(number / 1024).toFixed(1)} KB`;
  if (number < 1024 * 1024 * 1024) return `${(number / (1024 * 1024)).toFixed(1)} MB`;
  return `${(number / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatKilobytes(kilobytes) {
  const number = Number(kilobytes);
  if (!Number.isFinite(number)) return '—';
  return formatBytes(number * 1024);
}
