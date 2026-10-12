export const DAILY_REPORT_TIME_ZONE = "America/New_York"

function easternParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: DAILY_REPORT_TIME_ZONE,
    year: "numeric",
  }).formatToParts(now)
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function getEasternReportDate(now: Date) {
  const parts = easternParts(now)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function isDailyOperationsReportTime(now: Date) {
  return Number(easternParts(now).hour) === 6
}
