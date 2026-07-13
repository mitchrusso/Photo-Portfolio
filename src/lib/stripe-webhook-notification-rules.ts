type JsonRecord = Record<string, unknown>

function asObject(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? value as JsonRecord : null
}

function hasLifecycleMarker(metadata: JsonRecord | null) {
  return metadata?.source === "subscriber_lifecycle_verifier" || typeof metadata?.qaRunId === "string"
}

export function isSubscriberLifecycleVerificationObject(object: JsonRecord) {
  const directEmail = typeof object.customer_email === "string"
    ? object.customer_email
    : typeof object.email === "string"
      ? object.email
      : null
  const customerDetails = asObject(object.customer_details)
  const customerEmail = directEmail ?? (typeof customerDetails?.email === "string" ? customerDetails.email : null)
  const parent = asObject(object.parent)
  const subscriptionDetails = asObject(parent?.subscription_details)

  return customerEmail?.toLowerCase().startsWith("qa-lifecycle+") === true ||
    hasLifecycleMarker(asObject(object.metadata)) ||
    hasLifecycleMarker(asObject(subscriptionDetails?.metadata))
}
