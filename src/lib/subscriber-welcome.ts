import { getPrismaClient } from "@/lib/db"

export async function isSubscriberWelcomeTourPending(workspaceId: string) {
  const workspace = await getPrismaClient().workspace.findUnique({
    select: { welcomeTourPending: true },
    where: { id: workspaceId },
  })

  return workspace?.welcomeTourPending ?? false
}
