import { randomBytes } from "node:crypto"

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomSegment(length: number) {
  const bytes = randomBytes(length)
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

export function createOneTimeAccessCodeValue() {
  return `PV-${randomSegment(4)}-${randomSegment(4)}`
}
