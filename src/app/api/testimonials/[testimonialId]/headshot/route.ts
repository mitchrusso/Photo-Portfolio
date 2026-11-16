import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { isAdminSession } from "@/lib/admin-access"
import { getPrismaClient } from "@/lib/db"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"

export async function GET(_request: Request, { params }: { params: Promise<{ testimonialId: string }> }) {
  const { testimonialId } = await params
  const testimonial = await getPrismaClient().testimonial.findUnique({
    select: { headshotUrl: true, status: true, userId: true },
    where: { id: testimonialId },
  })
  if (!testimonial) return new NextResponse("Not found", { status: 404 })

  const session = await auth()
  const canView = testimonial.status === "APPROVED" || testimonial.userId === session?.user?.id || isAdminSession(session)
  if (!canView) return new NextResponse("Not found", { status: 404 })

  const url = await getPhotoDeliveryUrl(testimonial.headshotUrl, { expiresIn: 10 * 60 })
  return NextResponse.redirect(url, { status: 307 })
}
