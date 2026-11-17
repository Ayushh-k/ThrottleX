export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculateDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e - s;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateHours(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e - s;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
}

export function formatKm(km) {
  if (km === undefined || km === null) return '0 km';
  return Number(km).toLocaleString('en-IN') + ' km';
}
