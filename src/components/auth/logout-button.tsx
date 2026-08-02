"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"

type LogoutButtonProps = {
  className?: string
  label?: string
}

export function LogoutButton({
  className,
  label = "Log out",
}: LogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  return (
    <button
      aria-busy={isSigningOut}
      className={className}
      disabled={isSigningOut}
      onClick={async () => {
        setIsSigningOut(true)

        try {
          await signOut({ redirect: false })
          window.location.assign(`${window.location.origin}/login`)
        } catch {
          setIsSigningOut(false)
        }
      }}
      type="button"
    >
      <LogOut className="size-4" />
      <span>{isSigningOut ? "Signing out…" : label}</span>
    </button>
  )
}
