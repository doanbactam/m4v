export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(num);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
} 