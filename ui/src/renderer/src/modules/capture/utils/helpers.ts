export function formatDatetime(datetime: string) {
  const date = new Date(datetime)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${date.toLocaleDateString()} at ${hours}:${minutes}:${seconds}`
}
