export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
};

export const formatToIST = (dateInput: string | Date | number) => {
  if (!dateInput) return '';
  
  let date: Date;
  if (typeof dateInput === 'string') {
    // SQLite sometimes returns dates with space instead of T, or without Z.
    // We ensure it's treated as UTC if no timezone is specified.
    let sanitized = dateInput.trim();
    if (!sanitized.includes('Z') && !sanitized.includes('+')) {
      if (!sanitized.includes('T')) {
        sanitized = sanitized.replace(' ', 'T');
      }
      // Only append Z if it looks like a date-time string without timezone
      if (sanitized.length >= 10 && !sanitized.endsWith('Z')) {
        sanitized += 'Z';
      }
    }
    date = new Date(sanitized);
  } else {
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short'
  }).format(date);
};
