"use client"

import Image from "next/image"
import { Quote } from "lucide-react"
import { useEffect, useState } from "react"
import styles from "./testimonial-carousel.module.css"

type PublicTestimonial = {
  body: string
  firstName: string
  id: string
  lastInitial: string
}

export function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/testimonials/public", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { testimonials: [] })
      .then((payload: { testimonials?: PublicTestimonial[] }) => setTestimonials(payload.testimonials ?? []))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  if (testimonials.length < 3) return null
  const scrollingTestimonials = [...testimonials, ...testimonials]

  return (
    <section aria-label="PhotoView subscriber testimonials" className="border-b border-[#d7e2dc] bg-[#fffaf2] py-12">
      <div className="mx-auto max-w-6xl px-6 text-center md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">From the PhotoView community</p>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Photographers ringing the bell for PhotoView.</h2>
      </div>
      <div className={`mt-7 ${styles.viewport}`}>
        <div className={`gap-5 px-2 ${styles.track}`}>
          {scrollingTestimonials.map((testimonial, index) => (
            <article className="w-[320px] shrink-0 rounded-xl border border-[#ded8cc] bg-white p-5 text-left shadow-sm sm:w-[390px]" key={`${testimonial.id}-${index}`}>
              <Quote className="size-6 text-[#d8a84f]" />
              <blockquote className="mt-3 line-clamp-5 min-h-[7.5rem] text-base leading-6 text-[#413d37]">“{testimonial.body}”</blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-[#eee7dc] pt-4">
                <Image alt="" className="size-12 rounded-full object-cover" height={48} src={`/api/testimonials/${testimonial.id}/headshot`} unoptimized width={48} />
                <p className="font-semibold text-[#1f211e]">{testimonial.firstName} {testimonial.lastInitial}.</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-[#777064]">The carousel pauses when you hover or focus on a story.</p>
    </section>
  )
}
