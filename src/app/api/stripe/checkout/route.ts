import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Direct checkout is no longer available. Start from the registration page so account and consent records are created before billing.",
      registrationUrl: "/register",
    },
    { status: 410 },
  )
}
