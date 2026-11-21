"use client"

import Image from "next/image"
import { Quote } from "lucide-react"
import { useEffect, useState } from "react"

type PublicTestimonial = {
  body: string
  firstName: string
  id: string
  lastInitial: string
}

export function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/testimonials/public", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { testimonials: [] })
      .then((payload: { testimonials?: PublicTestimonial[] }) => setTestimonials(payload.testimonials ?? []))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  if (testimonials.length < 2) return null

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section aria-label="PhotoView subscriber testimonials" className="border-b border-[#d7e2dc] bg-[#fffaf2] px-6 py-14 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">From the PhotoView community</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Built for photographers. Praised by photographers.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#6f685d]">Real experiences from photographers using PhotoView to organize, present, and publish their work.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 md:items-start">
          {testimonials.map((testimonial) => {
            const isExpanded = expandedIds.has(testimonial.id)
            const canExpand = testimonial.body.length > 260
            return (
              <article className="rounded-xl border border-[#ded8cc] bg-white p-6 text-left shadow-[0_12px_30px_rgba(80,65,45,0.08)]" key={testimonial.id}>
                <div className="flex items-center gap-4 border-b border-[#eee7dc] pb-4">
                  <Image
                    alt={`${testimonial.firstName} ${testimonial.lastInitial}.`}
                    className="size-16 rounded-full border border-[#ded8cc] object-cover"
                    height={64}
                    src={`/api/testimonials/${testimonial.id}/headshot`}
                    unoptimized
                    width={64}
                  />
                  <div>
                    <p className="font-semibold text-[#1f211e]">{testimonial.firstName} {testimonial.lastInitial}.</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9c6f1d]">PhotoView photographer</p>
                  </div>
                </div>
                <Quote className="mt-5 size-6 text-[#d8a84f]" aria-hidden="true" />
                <div className="relative mt-3">
                  <blockquote className={`whitespace-pre-line text-base leading-7 text-[#413d37] ${canExpand && !isExpanded ? "line-clamp-6" : ""}`}>“{testimonial.body}”</blockquote>
                  {canExpand && !isExpanded ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" /> : null}
                </div>
                {canExpand ? (
                  <button
                    aria-expanded={isExpanded}
                    className="mt-4 text-sm font-semibold text-[#72501b] underline decoration-[#d8a84f] decoration-2 underline-offset-4 hover:text-[#1d2b22]"
                    onClick={() => toggleExpanded(testimonial.id)}
                    type="button"
                  >
                    {isExpanded ? "Show less" : "Read full testimonial"}
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
