export function normalizeAiHelpAnswer(value: string) {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim()
}

export function normalizeAiHelpStepAnswer(value: string, maxSteps = 4) {
  const normalized = normalizeAiHelpAnswer(value)
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !/^answer:?$/i.test(line))
    .map((line) => line.replace(/^(?:\d+[.)]|[-*•])\s*/, "").trim())
    .filter(Boolean)

  const steps = (lines.length > 1
    ? lines
    : normalized.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean)
  ).slice(0, Math.max(1, maxSteps))

  return steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n")
}
