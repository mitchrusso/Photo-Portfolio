import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { shouldShowTestimonialCarousel } from "@/lib/testimonials"

export const dynamic = "force-dynamic"

export async function GET() {
  const testimonials = await getPrismaClient().testimonial.findMany({
    orderBy: [{ displayOrder: "asc" }, { approvedAt: "desc" }],
    select: { body: true, firstName: true, id: true, lastInitial: true },
    take: 12,
    where: { isFeatured: true, permissionGranted: true, status: "APPROVED" },
  })

  return NextResponse.json(
    { testimonials: shouldShowTestimonialCarousel(testimonials.length) ? testimonials : [] },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  )
}
