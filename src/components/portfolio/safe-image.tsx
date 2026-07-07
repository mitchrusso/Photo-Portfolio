"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

type SafeImageProps = Omit<ImageProps, "alt"> & {
  alt: string
}

export function SafeImage(props: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null)

  if (failedSrc === props.src) return null

  return <Image {...props} alt={props.alt} onError={(event) => {
    props.onError?.(event)
    setFailedSrc(props.src)
  }} />
}
