import Script from "next/script"

export const OPENAI_Q_PIXEL_ID = "JR8198fWnQT7fpiNnCbtxB"

export function OpenAiQPixel() {
  return (
    <Script id="openai-q-registration-pixel" strategy="lazyOnload">
      {`!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f);}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("init",{pixelId:"${OPENAI_Q_PIXEL_ID}",debug:true});`}
    </Script>
  )
}
