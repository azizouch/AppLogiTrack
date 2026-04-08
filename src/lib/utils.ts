import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const parseDateString = (dateString?: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isDateTodayLocal = (dateString?: string | null) => {
  const date = parseDateString(dateString);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const isDateThisMonthLocal = (dateString?: string | null) => {
  const date = parseDateString(dateString);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

export const getStatusBadgeClass = (couleur: string) => {
  const badgeColorMap: { [key: string]: string } = {
    blue: 'text-blue-300 border-blue-300 bg-transparent dark:text-blue-200',
    green: 'text-green-300 border-green-300 bg-transparent dark:text-green-200',
    red: 'text-red-300 border-red-300 bg-transparent dark:text-red-200',
    yellow: 'text-yellow-300 border-yellow-300 bg-transparent dark:text-yellow-200',
    orange: 'text-orange-300 border-orange-300 bg-transparent dark:text-orange-200',
    purple: 'text-purple-300 border-purple-300 bg-transparent dark:text-purple-200',
    pink: 'text-pink-300 border-pink-300 bg-transparent dark:text-pink-200',
    gray: 'text-gray-300 border-gray-300 bg-transparent dark:text-gray-300',
    teal: 'text-teal-300 border-teal-300 bg-transparent dark:text-teal-200',
    indigo: 'text-indigo-300 border-indigo-300 bg-transparent dark:text-indigo-200',
    lime: 'text-lime-300 border-lime-300 bg-transparent dark:text-lime-200',
    cyan: 'text-cyan-300 border-cyan-300 bg-transparent dark:text-cyan-200',
    amber: 'text-amber-300 border-amber-300 bg-transparent dark:text-amber-200',
  };
  return badgeColorMap[couleur] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-300';
};
