export const DASHBOARD_THEME_STORAGE_KEY = "photoview-dashboard-theme"

export type DashboardTheme = "dark" | "light"

export function dashboardThemeFromCookie(cookieHeader: string): DashboardTheme | null {
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DASHBOARD_THEME_STORAGE_KEY}=`))
    ?.slice(DASHBOARD_THEME_STORAGE_KEY.length + 1)

  return value === "dark" || value === "light" ? value : null
}

export function dashboardThemeCookie(theme: DashboardTheme, hostname: string, secure: boolean) {
  const sharedDomain = hostname === "photoview.io" || hostname.endsWith(".photoview.io")
    ? "; Domain=.photoview.io"
    : ""
  const secureAttribute = secure ? "; Secure" : ""
  return `${DASHBOARD_THEME_STORAGE_KEY}=${theme}; Max-Age=31536000; Path=/${sharedDomain}; SameSite=Lax${secureAttribute}`
}

export function restoreDashboardTheme(): DashboardTheme | null {
  const cookieTheme = dashboardThemeFromCookie(document.cookie)
  if (cookieTheme) return cookieTheme

  try {
    const savedTheme = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY)
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : null
  } catch {
    return null
  }
}

export function persistDashboardTheme(theme: DashboardTheme) {
  try {
    window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme)
  } catch {
    // The first-party cookie still preserves the preference when browser storage is restricted.
  }

  document.cookie = dashboardThemeCookie(theme, window.location.hostname, window.location.protocol === "https:")
}
