export type WebsiteImageFrame = "none" | "thin" | "gold" | "shadow" | "print"

export function getWebsiteImageFramePresentation(frame: WebsiteImageFrame, requestedThickness: number | undefined) {
  const thickness = frame === "none" ? 0 : Math.max(1, Math.min(16, requestedThickness ?? 2))
  const className =
    frame === "none"
      ? "border-transparent shadow-none"
      : frame === "gold"
        ? "border-[#d8a84f] shadow-[0_10px_28px_rgba(96,66,23,0.28)]"
        : frame === "shadow"
          ? "border-black/25 shadow-[0_16px_38px_rgba(0,0,0,0.34)]"
          : frame === "print"
            ? "border-white shadow-[0_12px_30px_rgba(0,0,0,0.24)]"
            : "border-current/35"

  return {
    className,
    style: {
      borderStyle: "solid" as const,
      borderWidth: thickness,
      boxSizing: "border-box" as const,
    },
    thickness,
  }
}
