import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateStrictStreak(logs: string[]) {
  if (!logs || logs.length === 0) return 0;
  
  // Sort dates descending
  const uniqueDates = [...new Set(logs)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  let streak = 0;
  let currentDateToCheck = todayStr;

  // If the most recent workout is neither today nor yesterday, the streak is broken (0)
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  // If the most recent is yesterday, start checking from yesterday
  if (uniqueDates[0] === yesterdayStr) {
    currentDateToCheck = yesterdayStr;
  }

  for (const logDate of uniqueDates) {
    if (logDate === currentDateToCheck) {
      streak++;
      currentDateToCheck = format(subDays(parseISO(currentDateToCheck), 1), 'yyyy-MM-dd');
    } else {
      break; // Gap found, streak ends
    }
  }

  return streak;
}
