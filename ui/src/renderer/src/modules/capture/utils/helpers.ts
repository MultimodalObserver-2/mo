/**
 * @module helpers
 * This file contains utility functions for formatting dates, times, and durations.
 */

/**
 * Formats a datetime string into a locale-specific date and a fixed HH:MM:SS time.
 * @param {string} datetime - The date string to format.
 * @returns {string} The formatted date and time string (e.g., "6/12/2025 at 11:07:05").
 */
export function formatDatetime(datetime: string) {
  const date = new Date(datetime)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${date.toLocaleDateString()} at ${hours}:${minutes}:${seconds}`
}

/**
 * Converts a total duration in seconds into an object of hours, minutes, and seconds.
 * @param {number} duration - The total duration in seconds.
 * @returns {{ hours: number; minutes: number; seconds: number }} An object containing the separated time components.
 */
export function getDuration(duration: number): { hours: number; minutes: number; seconds: number } {
  if (duration <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = Math.floor(duration % 60)

  return { hours, minutes, seconds }
}

/**
 * Formats a total duration in seconds into a time string (e.g., 'HH:MM:SS').
 * @param {number} duration - The total duration in seconds.
 * @param {boolean} [showHours=true] - If false and hours are zero, the hours part will be omitted (e.g., 'MM:SS').
 * @param {boolean} [ceil=false] - If true, rounds the duration up to the nearest second.
 * @returns {string} The formatted duration string.
 */
export function formatDuration(duration: number, showHours = true, ceil = false): string {
  let totalSeconds = duration
  if (ceil) {
    totalSeconds = Math.ceil(duration)
  }
  const { hours, minutes, seconds } = getDuration(totalSeconds)
  const pad = (num: number) => String(num).padStart(2, "0")
  if (hours === 0 && !showHours) {
    const formattedMinutes = minutes == 0 ? "0" : pad(minutes)
    return `${formattedMinutes}:${pad(seconds)}`
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
