import { ImageResponse } from "next/og"

export const alt = "PhotoView.io — a beautiful home for the photography you care about most"
export const size = {
  height: 630,
  width: 1200,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(118deg, #f2faf7 0%, #fbf7f0 62%, #fffaf1 100%)",
          color: "#1f211e",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "54px 64px 50px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
            <div style={{ background: "#dcae4e", borderRadius: 999, display: "flex", height: 14, width: 14 }} />
            <div style={{ display: "flex", fontSize: 34, fontWeight: 750 }}>PhotoView.io</div>
          </div>
          <div
            style={{
              alignItems: "center",
              background: "#1d2b22",
              border: "2px solid #dcae4e",
              borderRadius: 999,
              color: "#f5cf66",
              display: "flex",
              fontSize: 20,
              fontWeight: 750,
              letterSpacing: "0.14em",
              padding: "15px 24px",
              textTransform: "uppercase",
            }}
          >
            Store&nbsp; · &nbsp;Curate&nbsp; · &nbsp;Display&nbsp; · &nbsp;Share
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1040 }}>
          <div
            style={{
              display: "flex",
              fontSize: 70,
              fontWeight: 780,
              letterSpacing: "-0.045em",
              lineHeight: 1.04,
            }}
          >
            A beautiful home for the photography you care about most.
          </div>
          <div
            style={{
              color: "#625d54",
              display: "flex",
              fontSize: 25,
              lineHeight: 1.45,
              marginTop: 28,
              maxWidth: 980,
            }}
          >
            Store your work, curate your strongest images, display them beautifully on desktop and mobile, and share polished portfolios anywhere.
          </div>
        </div>

        <div style={{ alignItems: "center", color: "#6b665c", display: "flex", fontSize: 21, justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>Built for serious photographers.</div>
          <div style={{ color: "#1d2b22", display: "flex", fontWeight: 700 }}>photoview.io</div>
        </div>
      </div>
    ),
    size,
  )
}
