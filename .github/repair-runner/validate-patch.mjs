import { execFileSync } from "node:child_process"
import { lstatSync } from "node:fs"

const output = execFileSync("git", ["diff", "--name-status", "-z", "HEAD"], { encoding: "utf8" })
const fields = output.split("\0").filter(Boolean)
const changed = []

for (let index = 0; index < fields.length;) {
  const status = fields[index++]
  if (/^[RC]/.test(status)) {
    const from = fields[index++]
    const to = fields[index++]
    changed.push(from, to)
  } else {
    changed.push(fields[index++])
  }
}

const paths = [...new Set(changed)]
if (paths.length === 0) throw new Error("The repair produced no code changes.")
if (paths.length > 12) throw new Error(`The repair changed ${paths.length} files; the autonomous limit is 12.`)

const allowedRoots = ["src/", "tests/", "public/"]
const protectedPaths = [
  /^\.github\//,
  /^prisma\//,
  /^scripts\//,
  /^src\/app\/api\/auth\//,
  /^src\/app\/api\/feedback\//,
  /^src\/app\/api\/stripe\//,
  /^src\/app\/api\/admin\//,
  /^src\/app\/admin\//,
  /^src\/auth\.ts$/,
  /^src\/proxy\.ts$/,
  /^src\/lib\/(?:admin|auth|bearer|db|email|feedback-workflow|operational|request-origin|security)/,
  /(?:^|\/)middleware\.[cm]?[jt]sx?$/,
  /(?:^|\/)(?:package|package-lock|pnpm-lock|yarn\.lock|next\.config|vercel\.json|\.env)/,
]

for (const path of paths) {
  if (!allowedRoots.some((root) => path.startsWith(root))) throw new Error(`Repair path is outside the autonomous allowlist: ${path}`)
  if (protectedPaths.some((pattern) => pattern.test(path))) throw new Error(`Repair path is protected: ${path}`)
  try {
    if (lstatSync(path).isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${path}`)
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error
  }
}

if (!paths.some((path) => path.startsWith("src/"))) throw new Error("The repair must include an application-code change under src/.")
if (!paths.some((path) => /^tests\/.*\.test\.ts$/.test(path))) throw new Error("The repair must add or update a regression test under tests/.")

const numstat = execFileSync("git", ["diff", "--numstat", "HEAD"], { encoding: "utf8" }).trim()
let changedLines = 0
for (const line of numstat ? numstat.split("\n") : []) {
  const [added, deleted, path] = line.split("\t")
  if (added === "-" || deleted === "-") throw new Error(`Binary changes are not allowed: ${path}`)
  changedLines += Number(added) + Number(deleted)
}
if (changedLines > 1_200) throw new Error(`The repair changed ${changedLines} lines; the autonomous limit is 1,200.`)

process.stdout.write(`Validated ${paths.length} files and ${changedLines} changed lines.\n`)
