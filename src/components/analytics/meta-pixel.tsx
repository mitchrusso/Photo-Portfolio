import Script from "next/script"

export type MetaConversionEventName = "CompleteRegistration" | "Lead" | "ViewContent"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackMetaConversionEvent(eventName: MetaConversionEventName) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false
  window.fbq("track", eventName)
  return true
}

export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="lazyOnload">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','585605748256021');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          src="https://www.facebook.com/tr?id=585605748256021&ev=PageView&noscript=1"
          style={{ display: "none" }}
          width="1"
        />
      </noscript>
    </>
  )
}
