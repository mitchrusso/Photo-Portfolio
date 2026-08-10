import Script from "next/script"

export type RedditConversionEventName = "Lead" | "SignUp" | "ViewContent"

declare global {
  interface Window {
    rdt?: (...args: unknown[]) => void
  }
}

export function trackRedditConversionEvent(eventName: RedditConversionEventName) {
  if (typeof window === "undefined" || typeof window.rdt !== "function") return false
  window.rdt("track", eventName)
  return true
}

export function RedditPixel() {
  return (
    <Script id="reddit-pixel" strategy="afterInteractive">
      {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js?pixel_id=t2_cel8iytkw",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','t2_cel8iytkw');rdt('track','PageVisit');`}
    </Script>
  )
}
