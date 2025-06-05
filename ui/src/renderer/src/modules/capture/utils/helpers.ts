export function formatDatetime(datetime: string) {
  const date = new Date(datetime)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${date.toLocaleDateString()} at ${hours}:${minutes}:${seconds}`
}

export function getDuration(duration: number): { hours: number; minutes: number; seconds: number } {
  if (duration <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = Math.floor(duration % 60)

  return { hours, minutes, seconds }
}

export function formatDuration(duration: number, showHours = true) {
  const { hours, minutes, seconds } = getDuration(duration)
  const pad = (num: number) => String(num).padStart(2, "0")
  if (hours === 0 && !showHours) {
    const formattedMinutes = minutes == 0 ? "0" : pad(minutes)
    return `${formattedMinutes}:${pad(seconds)}`
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
