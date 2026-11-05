export function isExpectedUploadRejection(message: string) {
  return /exceed|could not be found|not a valid|invalid|unsupported|decode|pixel|dimensions|empty|already been saved/i.test(message)
}
