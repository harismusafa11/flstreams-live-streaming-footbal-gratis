import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatToWIB(dateInput: string | Date, pattern: 'dd MMM • HH:mm' | 'HH:mm' | 'MMM d, yyyy' | 'default' = 'default'): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Jadwal';

    // Format directly to Asia/Jakarta (WIB)
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

    const day = partMap.day;
    const month = partMap.month;
    const year = partMap.year;
    const hour = partMap.hour;
    const minute = partMap.minute;

    const monthNamesIndo = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = monthNamesIndo[monthIndex] || month;

    if (pattern === 'HH:mm') {
      return `${hour}:${minute} WIB`;
    }
    if (pattern === 'dd MMM • HH:mm') {
      return `${day} ${monthName} • ${hour}:${minute} WIB`;
    }
    if (pattern === 'MMM d, yyyy') {
      return `${day} ${monthName} ${year}`;
    }

    return `${day} ${monthName} ${year}, ${hour}:${minute} WIB`;
  } catch (err) {
    console.error("formatToWIB error:", err);
    return 'Jadwal';
  }
}
