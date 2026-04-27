export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatDate = (dateString) => {
  if (!dateString) return '';
  // If it's a pre-calculated weekly range, bypass formatting
  if (dateString.includes('→')) return dateString;

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const d = new Date(dateString);
  return isNaN(d) ? dateString : d.toLocaleDateString(undefined, options);
};

export const calculateActiveHours = (checkIn, checkOut) => {
  if (!checkIn) return '0h 0m';

  // Sanitize string (handle cases where backend might send double timezone info)
  const sanitize = (str) => typeof str === 'string' ? str.replace('+00:00Z', 'Z') : str;

  const start = new Date(sanitize(checkIn));
  const end = checkOut ? new Date(sanitize(checkOut)) : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '0h 0m';

  const diffMs = end - start;
  if (diffMs < 0) return '0h 0m';
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
};
