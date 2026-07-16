import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"

export default async function StripeCatalogMigrationPage() {
  const session = await auth()
  if (!isSuperAdminSession(session)) redirect("/login")

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-16 text-[#1f211e]">
      <section className="mx-auto max-w-xl rounded-lg border border-[#ded8cc] bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a46f18]">Superadmin rollout</p>
        <h1 className="mt-3 text-3xl font-semibold">Create the July 2026 Stripe catalog</h1>
        <p className="mt-4 leading-7 text-[#625c52]">
          This idempotent action creates or reuses the eight new PhotoView.io live prices. It does not alter legacy prices or existing subscriptions.
        </p>
        <form action="/api/admin/stripe/catalog" className="mt-6" method="post">
          <button className="rounded-md bg-[#1d2b22] px-5 py-3 font-semibold text-white" type="submit">
            Create or verify live prices
          </button>
        </form>
      </section>
    </main>
  )
}
