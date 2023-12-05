export function formatDate(date: Date): string {
  date = new Date(date.getTime() + 9 * 3600_000)
  return `${date.getUTCFullYear()}/${
    date.getUTCMonth() + 1
  }/${date.getUTCDate()}`
}
