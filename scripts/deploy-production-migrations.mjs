import { spawn } from "node:child_process"
import { pathToFileURL } from "node:url"

const DEFAULT_MAX_ATTEMPTS = 4
const DEFAULT_RETRY_DELAYS_MS = [3_000, 6_000, 12_000]

export function isRetryableMigrationFailure(output) {
  return /\bP1001\b/.test(output)
}

function runPrismaMigration() {
  return new Promise((resolve, reject) => {
    const child = spawn("prisma", ["migrate", "deploy"], {
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"],
    })
    let output = ""

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString()
      output += text
      process.stdout.write(text)
    })
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      output += text
      process.stderr.write(text)
    })
    child.on("error", reject)
    child.on("close", (code) => resolve({ code: code ?? 1, output }))
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function deployMigrationsWithRetry({
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  retryDelaysMs = DEFAULT_RETRY_DELAYS_MS,
  runMigration = runPrismaMigration,
  sleep = wait,
} = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runMigration()
    if (result.code === 0) return

    const canRetry = attempt < maxAttempts && isRetryableMigrationFailure(result.output)
    if (!canRetry) {
      throw new Error(`Prisma migration deployment failed on attempt ${attempt}.`)
    }

    const delay = retryDelaysMs[Math.min(attempt - 1, retryDelaysMs.length - 1)]
    console.warn(
      `Database is temporarily unreachable (P1001). Retrying migration ${attempt + 1}/${maxAttempts} in ${delay / 1_000}s.`,
    )
    await sleep(delay)
  }
}

async function main() {
  if (process.env.VERCEL_ENV !== "production") return

  try {
    await deployMigrationsWithRetry()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

const entryPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === entryPath) {
  await main()
}
