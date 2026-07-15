export type WebsiteImageFrame = "none" | "thin" | "gold" | "shadow" | "print"

export function getWebsiteImageFramePresentation(frame: WebsiteImageFrame, requestedThickness: number | undefined) {
  const thickness = frame === "none" ? 0 : Math.max(1, Math.min(16, requestedThickness ?? 2))
  const frameColor =
    frame === "gold"
      ? "#d8a84f"
      : frame === "print"
        ? "#ffffff"
        : frame === "shadow"
          ? "rgba(255, 255, 255, 0.34)"
          : "rgba(255, 255, 255, 0.82)"
  const boxShadow =
    frame === "none"
      ? "none"
      : frame === "gold"
        ? "0 0 0 1px rgba(74, 48, 12, 0.72), 0 10px 28px rgba(96, 66, 23, 0.28)"
        : frame === "shadow"
          ? "0 0 0 1px rgba(0, 0, 0, 0.44), 0 16px 38px rgba(0, 0, 0, 0.34)"
          : frame === "print"
            ? "0 0 0 1px rgba(0, 0, 0, 0.24), 0 12px 30px rgba(0, 0, 0, 0.24)"
            : "0 0 0 1px rgba(0, 0, 0, 0.68)"

  return {
    className: "website-image-frame border-0",
    style: {
      "--website-image-frame-color": frame === "none" ? "transparent" : frameColor,
      "--website-image-frame-thickness": `${thickness}px`,
      boxSizing: "border-box" as const,
      boxShadow,
    },
    thickness,
  }
}
