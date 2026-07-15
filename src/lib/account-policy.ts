export const accountFilePolicy = [
  {
    title: "Canceled trials",
    body: "If a trial is canceled before billing starts, public portfolios, embeds, downloads, and sharing links are disabled when trial access ends.",
  },
  {
    title: "Canceled paid subscriptions",
    body: "If a paid subscription is canceled, public hosting continues through the already-paid billing period. At the end of that period, public portfolios, embeds, downloads, and sharing links are disabled.",
  },
  {
    title: "Expired cards or failed payments",
    body: "If a payment method fails or expires, Stripe handles retries and PhotoView.io sends account notices. If payment is not resolved within 7 days after the due date, public portfolio delivery may be paused until billing is fixed.",
  },
  {
    title: "Private retention window",
    body: "After access ends, files are kept privately for 30 days so the subscriber can reactivate, export, or request deletion. We do not keep publicly hosting portfolios after paid access ends.",
  },
  {
    title: "Deletion after retention",
    body: "After the 30-day private retention window, account files are queued for deletion from active storage, including originals, display images, thumbnails, watermarks, and portfolio media. Routine backups or logs may persist briefly until normal backup cycles expire.",
  },
  {
    title: "Immediate deletion requests",
    body: "A subscriber may request deletion sooner. Once deletion is completed, the files cannot be recovered from PhotoView.io.",
  },
] as const
