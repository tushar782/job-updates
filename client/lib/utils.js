import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date) {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatTimeAgo(date) {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDuration(milliseconds) {
  if (!milliseconds) return 'N/A';
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function calculateSuccessRate(totalFetched, totalImported) {
  if (totalFetched === 0) return 0;
  return ((totalImported / totalFetched) * 100).toFixed(1);
}