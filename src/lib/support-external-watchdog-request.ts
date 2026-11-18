export function externalSupportWatchdogDispatchRequest(input: {
  repository?: string
  token: string
}) {
  const repository = input.repository?.trim() || "mitchrusso/Photo-Portfolio"
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPAIR_REPOSITORY is invalid.")
  }
  const [owner, repo] = repository.split("/")
  return {
    init: {
      body: JSON.stringify({ ref: "main" }),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
        "User-Agent": "PhotoView-Support-Watchdog-Dispatcher",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      method: "POST",
    } satisfies RequestInit,
    url: `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/support-engine-watchdog.yml/dispatches`,
  }
}
