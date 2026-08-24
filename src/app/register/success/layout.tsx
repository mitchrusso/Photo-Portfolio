import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { follow: true, index: false },
}

export default function RegistrationSuccessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
