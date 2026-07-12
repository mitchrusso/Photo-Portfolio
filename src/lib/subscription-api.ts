import { NextResponse } from "next/server"
import { getWorkspaceEntitlement, type WorkspaceEntitlement } from "@/lib/subscription-entitlements"

export function subscriptionWriteBlockResponse(entitlement: WorkspaceEntitlement) {
  return NextResponse.json({
    code: entitlement.code,
    error: entitlement.message,
    readOnly: entitlement.mode === "read-only",
  }, { status: 402 })
}

export async function getSubscriptionWriteBlock(workspaceId: string) {
  const entitlement = await getWorkspaceEntitlement(workspaceId)
  if (entitlement.mode === "write") return null
  return subscriptionWriteBlockResponse(entitlement)
}
