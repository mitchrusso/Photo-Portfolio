"use client"

import { ArrowLeft, Camera, Mail, MapPin, PenLine, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { migratedGalleries } from "@/data/migrated-galleries"
import { LOCAL_GALLERY_STORAGE_KEY, type PortfolioGallery } from "@/lib/gallery-utils"

const WEBSITE_BUILDER_STORAGE_KEY = "photoviewpro-website-builder-v1"

type WebsiteTemplate =
  | "article-first"
  | "adventure-map"
  | "about-first"
  | "bold-color"
  | "botanical-soft"
  | "cinematic-home"
  | "clean-grid"
  | "coastal-clean"
  | "creator-studio"
  | "darkroom"
  | "editorial-magazine"
  | "fashion-panel"
  | "fine-art-index"
  | "gallery-luxe"
  | "gear-notebook"
  | "landing-portfolios"
  | "panorama-scroll"
  | "minimal-white"
  | "mosaic-board"
  | "museum-wall"
  | "monochrome-zine"
  | "portfolio-index"
  | "portrait-card"
  | "social-hub"
  | "split-hero"
  | "studio-card"
  | "street-poster"
  | "story-journal"
  | "travel-atlas"
  | "wedding-air"

type WebsiteBuilderSettings = {
  customDomain: string
  customPageTitle: string
  enabledBlocks: {
    articles: boolean
    callToAction: boolean
    featuredPortfolio: boolean
    gear: boolean
    hero: boolean
    portfolioGrid: boolean
    textBlock: boolean
  }
  enabledPages: {
    about: boolean
    articles: boolean
    blog: boolean
    contact: boolean
    custom: boolean
    gear: boolean
    home: boolean
  }
  featuredGalleryIds: string[]
  heroButtonLabel: string
  heroHeadline: string
  heroSubhead: string
  subdomain: string
  template: WebsiteTemplate
}

function createDefaultWebsiteSettings(galleries: PortfolioGallery[]): WebsiteBuilderSettings {
  return {
    customDomain: "",
    customPageTitle: "Trips",
    enabledBlocks: {
      articles: true,
      callToAction: true,
      featuredPortfolio: true,
      gear: false,
      hero: true,
      portfolioGrid: true,
      textBlock: true,
    },
    enabledPages: {
      about: true,
      articles: true,
      blog: true,
      contact: true,
      custom: false,
      gear: true,
      home: true,
    },
    featuredGalleryIds: galleries.slice(0, 4).map((gallery) => gallery.id),
    heroButtonLabel: "View portfolios",
    heroHeadline: "Photography worth slowing down for.",
    heroSubhead: "A curated home for the work, stories, trips, and tools behind the images.",
    subdomain: "yourname",
    template: "cinematic-home",
  }
}

const templateLabels: Record<WebsiteTemplate, string> = {
  "adventure-map": "Adventure map",
  "article-first": "Article first",
  "about-first": "About first",
  "bold-color": "Bold color",
  "botanical-soft": "Botanical soft",
  "cinematic-home": "Cinematic home",
  "clean-grid": "Clean portfolio grid",
  "coastal-clean": "Coastal clean",
  "creator-studio": "Creator studio",
  darkroom: "Darkroom",
  "editorial-magazine": "Editorial magazine",
  "fashion-panel": "Fashion panel",
  "fine-art-index": "Fine art index",
  "gallery-luxe": "Gallery luxe",
  "gear-notebook": "Gear notebook",
  "landing-portfolios": "Landing + portfolios",
  "minimal-white": "Minimal white",
  "mosaic-board": "Mosaic board",
  "museum-wall": "Museum wall",
  "monochrome-zine": "Monochrome zine",
  "panorama-scroll": "Panorama scroll",
  "portfolio-index": "Portfolio index",
  "portrait-card": "Portrait card",
  "social-hub": "Social hub",
  "split-hero": "Split hero",
  "studio-card": "Studio card",
  "story-journal": "Story journal",
  "street-poster": "Street poster",
  "travel-atlas": "Travel atlas",
  "wedding-air": "Wedding air",
}

type WebsitePreviewTheme = {
  accentClass: string
  borderClass: string
  cardClass: string
  ctaClass: string
  eyebrowClass: string
  headerClass: string
  headlineClass: string
  heroImageClass: string
  heroLayoutClass: string
  heroOverlayClass: string
  logoClass: string
  mutedClass: string
  pageClass: string
  secondaryButtonClass: string
}

const defaultPreviewTheme: WebsitePreviewTheme = {
  accentClass: "text-[#b9842d]",
  borderClass: "border-white/12",
  cardClass: "bg-white/[0.04] text-white",
  ctaClass: "bg-[#d8a84f] text-[#171814]",
  eyebrowClass: "text-[#b9842d]",
  headerClass: "bg-[#070806]/88",
  headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
  heroImageClass: "aspect-[4/3]",
  heroLayoutClass: "lg:grid-cols-[0.95fr_1.05fr]",
  heroOverlayClass: "bg-gradient-to-t from-black/45 via-transparent to-transparent",
  logoClass: "bg-[#d8a84f] text-[#171814]",
  mutedClass: "text-white/62",
  pageClass: "bg-[#070806] text-white",
  secondaryButtonClass: "border-white/12",
}

const websitePreviewThemes: Partial<Record<WebsiteTemplate, WebsitePreviewTheme>> = {
  "adventure-map": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d9c8a9]",
    cardClass: "bg-[#fff9ed] text-[#1f261f]",
    ctaClass: "bg-[#d87934] text-white",
    eyebrowClass: "text-[#d87934]",
    headerClass: "bg-[#f4efe2]/92",
    headlineClass: "font-mono text-4xl font-bold uppercase leading-[1.02] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.7fr_1.3fr]",
    logoClass: "bg-[#d87934] text-white",
    mutedClass: "text-[#66705a]",
    pageClass: "bg-[#f4efe2] text-[#1f261f]",
    secondaryButtonClass: "border-[#d9c8a9]",
  },
  "article-first": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded4c5]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#0f5f73] text-white",
    eyebrowClass: "text-[#0f5f73]",
    headerClass: "bg-[#f8f5ef]/92",
    headlineClass: "font-serif text-4xl font-semibold leading-[1.02] md:text-7xl",
    logoClass: "bg-[#0f5f73] text-white",
    mutedClass: "text-[#6f675c]",
    pageClass: "bg-[#f8f5ef] text-[#171814]",
    secondaryButtonClass: "border-[#ded4c5]",
  },
  "about-first": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8c6ad]",
    cardClass: "bg-[#fffaf3] text-[#27211b]",
    ctaClass: "bg-[#a87844] text-white",
    eyebrowClass: "text-[#a87844]",
    headerClass: "bg-[#f2e8da]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.05] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.78fr_1.22fr]",
    logoClass: "bg-[#a87844] text-white",
    mutedClass: "text-[#725f4c]",
    pageClass: "bg-[#f2e8da] text-[#27211b]",
    secondaryButtonClass: "border-[#d8c6ad]",
  },
  "bold-color": {
    ...defaultPreviewTheme,
    borderClass: "border-white/25",
    cardClass: "bg-white text-[#1436d8]",
    ctaClass: "bg-[#ffcf33] text-[#111]",
    eyebrowClass: "text-[#ffcf33]",
    headerClass: "bg-[#1436d8]/92",
    headlineClass: "font-sans text-5xl font-black uppercase leading-[0.92] md:text-7xl",
    logoClass: "bg-[#ffcf33] text-[#111]",
    mutedClass: "text-white/82",
    pageClass: "bg-[#1436d8] text-white",
    secondaryButtonClass: "border-white/35",
  },
  "botanical-soft": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ccd8bd]",
    cardClass: "bg-[#fbfbf3] text-[#25301f]",
    ctaClass: "bg-[#6d8f61] text-white",
    eyebrowClass: "text-[#6d8f61]",
    headerClass: "bg-[#eef2e4]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.08] md:text-6xl",
    logoClass: "bg-[#6d8f61] text-white",
    mutedClass: "text-[#66705c]",
    pageClass: "bg-[#eef2e4] text-[#25301f]",
    secondaryButtonClass: "border-[#ccd8bd]",
  },
  "clean-grid": {
    ...defaultPreviewTheme,
    borderClass: "border-[#dedede]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#171814] text-white",
    eyebrowClass: "text-[#555]",
    headerClass: "bg-white/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-5xl",
    heroLayoutClass: "lg:grid-cols-[1fr_1fr]",
    logoClass: "bg-[#171814] text-white",
    mutedClass: "text-[#666]",
    pageClass: "bg-white text-[#171814]",
    secondaryButtonClass: "border-[#dedede]",
  },
  "coastal-clean": {
    ...defaultPreviewTheme,
    borderClass: "border-[#cce5ee]",
    cardClass: "bg-white text-[#14303f]",
    ctaClass: "bg-[#4795bd] text-white",
    eyebrowClass: "text-[#4795bd]",
    headerClass: "bg-[#edf7fb]/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    heroImageClass: "aspect-[21/9] lg:aspect-[16/9]",
    logoClass: "bg-[#4795bd] text-white",
    mutedClass: "text-[#5d7884]",
    pageClass: "bg-[#edf7fb] text-[#14303f]",
    secondaryButtonClass: "border-[#cce5ee]",
  },
  "cinematic-home": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8a84f]/25",
    cardClass: "bg-[#161814] text-white",
    ctaClass: "bg-[#d8a84f] text-[#171814]",
    eyebrowClass: "text-[#d8a84f]",
    headerClass: "bg-[#070806]/88",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    heroImageClass: "aspect-[16/10]",
    logoClass: "bg-[#d8a84f] text-[#171814]",
    mutedClass: "text-white/62",
    pageClass: "bg-[#070806] text-white",
    secondaryButtonClass: "border-[#d8a84f]/25",
  },
  "creator-studio": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e4d1b2]",
    cardClass: "bg-[#fffaf0] text-[#211b13]",
    ctaClass: "bg-[#211b13] text-white",
    eyebrowClass: "text-[#a1702e]",
    headerClass: "bg-[#f7f1e4]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.76fr_1.24fr]",
    logoClass: "bg-[#d8a84f] text-[#211b13]",
    mutedClass: "text-[#776955]",
    pageClass: "bg-[#f7f1e4] text-[#211b13]",
    secondaryButtonClass: "border-[#e4d1b2]",
  },
  darkroom: {
    ...defaultPreviewTheme,
    borderClass: "border-[#bf8a35]/30",
    cardClass: "bg-[#181410] text-white",
    ctaClass: "bg-[#bf8a35] text-[#111]",
    eyebrowClass: "text-[#bf8a35]",
    headerClass: "bg-black/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.03] md:text-6xl",
    logoClass: "bg-[#bf8a35] text-[#111]",
    mutedClass: "text-white/60",
    pageClass: "bg-black text-white",
    secondaryButtonClass: "border-[#bf8a35]/30",
  },
  "editorial-magazine": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e7d6c5]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#c75f3c] text-white",
    eyebrowClass: "text-[#c75f3c]",
    headerClass: "bg-[#fbf7ef]/92",
    headlineClass: "font-serif text-5xl font-semibold leading-[0.98] md:text-7xl",
    logoClass: "bg-[#c75f3c] text-white",
    mutedClass: "text-[#71685d]",
    pageClass: "bg-[#fbf7ef] text-[#171814]",
    secondaryButtonClass: "border-[#e7d6c5]",
  },
  "fashion-panel": {
    ...defaultPreviewTheme,
    borderClass: "border-[#dfcdbf]",
    cardClass: "bg-[#fffaf6] text-[#17110d]",
    ctaClass: "bg-[#17110d] text-white",
    eyebrowClass: "text-[#a0723f]",
    headerClass: "bg-[#f4eee7]/92",
    headlineClass: "font-serif text-5xl font-semibold leading-[0.96] md:text-7xl",
    heroLayoutClass: "lg:grid-cols-[0.82fr_1.18fr]",
    logoClass: "bg-[#17110d] text-white",
    mutedClass: "text-[#7a6a60]",
    pageClass: "bg-[#f4eee7] text-[#17110d]",
    secondaryButtonClass: "border-[#dfcdbf]",
  },
  "fine-art-index": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded9cf]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#282828] text-white",
    eyebrowClass: "text-[#777]",
    headerClass: "bg-[#faf8f3]/92",
    headlineClass: "font-serif text-4xl font-normal leading-[1.08] md:text-6xl",
    logoClass: "bg-[#282828] text-white",
    mutedClass: "text-[#6d6a63]",
    pageClass: "bg-[#faf8f3] text-[#171814]",
    secondaryButtonClass: "border-[#ded9cf]",
  },
  "gallery-luxe": {
    ...defaultPreviewTheme,
    borderClass: "border-[#caa46a]/35",
    cardClass: "bg-[#241c16] text-[#f7ead8]",
    ctaClass: "bg-[#caa46a] text-[#17130f]",
    eyebrowClass: "text-[#caa46a]",
    headerClass: "bg-[#17130f]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.04] md:text-6xl",
    logoClass: "bg-[#caa46a] text-[#17130f]",
    mutedClass: "text-[#f7ead8]/68",
    pageClass: "bg-[#17130f] text-[#f7ead8]",
    secondaryButtonClass: "border-[#caa46a]/35",
  },
  "gear-notebook": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8c8ab]",
    cardClass: "bg-[#fff8e9] text-[#25211b]",
    ctaClass: "bg-[#2d6e63] text-white",
    eyebrowClass: "text-[#2d6e63]",
    headerClass: "bg-[#f3ead9]/92",
    headlineClass: "font-mono text-3xl font-bold uppercase leading-tight md:text-5xl",
    logoClass: "bg-[#2d6e63] text-white",
    mutedClass: "text-[#6f6552]",
    pageClass: "bg-[#f3ead9] text-[#25211b]",
    secondaryButtonClass: "border-[#d8c8ab]",
  },
  "landing-portfolios": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e3d5bd]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#171814] text-white",
    eyebrowClass: "text-[#9a6e2c]",
    headerClass: "bg-[#f9f6ef]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    logoClass: "bg-[#d8a84f] text-[#171814]",
    mutedClass: "text-[#736b60]",
    pageClass: "bg-[#f9f6ef] text-[#171814]",
    secondaryButtonClass: "border-[#e3d5bd]",
  },
  "minimal-white": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e5e5e5]",
    cardClass: "bg-white text-[#161616]",
    ctaClass: "bg-[#161616] text-white",
    eyebrowClass: "text-[#777]",
    headerClass: "bg-white/92",
    headlineClass: "font-sans text-3xl font-medium leading-tight md:text-5xl",
    logoClass: "bg-[#161616] text-white",
    mutedClass: "text-[#666]",
    pageClass: "bg-white text-[#161616]",
    secondaryButtonClass: "border-[#e5e5e5]",
  },
  "monochrome-zine": {
    ...defaultPreviewTheme,
    borderClass: "border-white/18",
    cardClass: "bg-white text-[#111]",
    ctaClass: "bg-white text-[#111]",
    eyebrowClass: "text-white/78",
    headerClass: "bg-[#111]/92",
    headlineClass: "font-mono text-4xl font-black uppercase leading-[0.96] md:text-6xl",
    logoClass: "bg-white text-[#111]",
    mutedClass: "text-white/62",
    pageClass: "bg-[#111] text-white",
    secondaryButtonClass: "border-white/25",
  },
  "museum-wall": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded4c5]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#8c785c] text-white",
    eyebrowClass: "text-[#8c785c]",
    headerClass: "bg-[#f8f4ec]/92",
    headlineClass: "font-serif text-4xl font-normal leading-[1.08] md:text-6xl",
    logoClass: "bg-[#8c785c] text-white",
    mutedClass: "text-[#70675b]",
    pageClass: "bg-[#f8f4ec] text-[#171814]",
    secondaryButtonClass: "border-[#ded4c5]",
  },
  "mosaic-board": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ddd1bf]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#d8a84f] text-[#171814]",
    eyebrowClass: "text-[#a77425]",
    headerClass: "bg-[#f4f0e8]/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    logoClass: "bg-[#d8a84f] text-[#171814]",
    mutedClass: "text-[#716a60]",
    pageClass: "bg-[#f4f0e8] text-[#171814]",
    secondaryButtonClass: "border-[#ddd1bf]",
  },
  "panorama-scroll": {
    ...defaultPreviewTheme,
    borderClass: "border-[#c8d8de]",
    cardClass: "bg-white text-[#1d2e35]",
    ctaClass: "bg-[#5c7e92] text-white",
    eyebrowClass: "text-[#5c7e92]",
    headerClass: "bg-[#eef3f4]/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    heroImageClass: "aspect-[21/9] lg:aspect-[21/9]",
    heroLayoutClass: "lg:grid-cols-1",
    logoClass: "bg-[#5c7e92] text-white",
    mutedClass: "text-[#607580]",
    pageClass: "bg-[#eef3f4] text-[#1d2e35]",
    secondaryButtonClass: "border-[#c8d8de]",
  },
  "portrait-card": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d9c4b7]",
    cardClass: "bg-[#fffaf6] text-[#211713]",
    ctaClass: "bg-[#211713] text-white",
    eyebrowClass: "text-[#a87855]",
    headerClass: "bg-[#efe2d7]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.04] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.72fr_1.28fr]",
    logoClass: "bg-[#211713] text-white",
    mutedClass: "text-[#7b6255]",
    pageClass: "bg-[#efe2d7] text-[#211713]",
    secondaryButtonClass: "border-[#d9c4b7]",
  },
  "portfolio-index": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ddd4c8]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#171814] text-white",
    eyebrowClass: "text-[#987233]",
    headerClass: "bg-[#f7f4ee]/92",
    headlineClass: "font-sans text-3xl font-semibold leading-tight md:text-5xl",
    heroLayoutClass: "lg:grid-cols-[0.68fr_1.32fr]",
    logoClass: "bg-[#171814] text-white",
    mutedClass: "text-[#6d675e]",
    pageClass: "bg-[#f7f4ee] text-[#171814]",
    secondaryButtonClass: "border-[#ddd4c8]",
  },
  "social-hub": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d9defc]",
    cardClass: "bg-white text-[#11152f]",
    ctaClass: "bg-[#5377ff] text-white",
    eyebrowClass: "text-[#5377ff]",
    headerClass: "bg-[#f2f4ff]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    logoClass: "bg-[#5377ff] text-white",
    mutedClass: "text-[#636b8d]",
    pageClass: "bg-[#f2f4ff] text-[#11152f]",
    secondaryButtonClass: "border-[#d9defc]",
  },
  "split-hero": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded2c0]",
    cardClass: "bg-white text-[#191715]",
    ctaClass: "bg-[#b4864e] text-white",
    eyebrowClass: "text-[#b4864e]",
    headerClass: "bg-[#f3eee6]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.85fr_1.15fr]",
    logoClass: "bg-[#b4864e] text-white",
    mutedClass: "text-[#6f675d]",
    pageClass: "bg-[#f3eee6] text-[#191715]",
    secondaryButtonClass: "border-[#ded2c0]",
  },
  "studio-card": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e0d3bd]",
    cardClass: "bg-white text-[#161713]",
    ctaClass: "bg-[#161713] text-white",
    eyebrowClass: "text-[#a97827]",
    headerClass: "bg-[#f7f2ea]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-5xl",
    heroLayoutClass: "lg:grid-cols-[0.9fr_1.1fr]",
    logoClass: "bg-[#d8a84f] text-[#161713]",
    mutedClass: "text-[#736a5d]",
    pageClass: "bg-[#f7f2ea] text-[#161713]",
    secondaryButtonClass: "border-[#e0d3bd]",
  },
  "story-journal": {
    ...defaultPreviewTheme,
    borderClass: "border-[#dec9b1]",
    cardClass: "bg-[#fff8ed] text-[#211a14]",
    ctaClass: "bg-[#9b6a45] text-white",
    eyebrowClass: "text-[#9b6a45]",
    headerClass: "bg-[#f5eadc]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.05] md:text-6xl",
    logoClass: "bg-[#9b6a45] text-white",
    mutedClass: "text-[#786554]",
    pageClass: "bg-[#f5eadc] text-[#211a14]",
    secondaryButtonClass: "border-[#dec9b1]",
  },
  "street-poster": {
    ...defaultPreviewTheme,
    borderClass: "border-white/18",
    cardClass: "bg-white text-[#111]",
    ctaClass: "bg-[#f2d15a] text-[#111]",
    eyebrowClass: "text-[#f2d15a]",
    headerClass: "bg-[#111]/92",
    headlineClass: "font-sans text-5xl font-black uppercase leading-[0.9] md:text-7xl",
    logoClass: "bg-[#f2d15a] text-[#111]",
    mutedClass: "text-white/66",
    pageClass: "bg-[#111] text-white",
    secondaryButtonClass: "border-white/25",
  },
  "travel-atlas": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8c8ae]",
    cardClass: "bg-[#fff9ed] text-[#1d251e]",
    ctaClass: "bg-[#d87934] text-white",
    eyebrowClass: "text-[#d87934]",
    headerClass: "bg-[#efe8da]/92",
    headlineClass: "font-mono text-4xl font-bold uppercase leading-[1.02] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.72fr_1.28fr]",
    logoClass: "bg-[#d87934] text-white",
    mutedClass: "text-[#686e5e]",
    pageClass: "bg-[#efe8da] text-[#1d251e]",
    secondaryButtonClass: "border-[#d8c8ae]",
  },
  "wedding-air": {
    ...defaultPreviewTheme,
    borderClass: "border-[#f0d8d2]",
    cardClass: "bg-white text-[#2b2020]",
    ctaClass: "bg-[#b77b73] text-white",
    eyebrowClass: "text-[#b77b73]",
    headerClass: "bg-[#fff7f4]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.05] md:text-6xl",
    logoClass: "bg-[#b77b73] text-white",
    mutedClass: "text-[#7f6864]",
    pageClass: "bg-[#fff7f4] text-[#2b2020]",
    secondaryButtonClass: "border-[#f0d8d2]",
  },
}

export function WebsiteDraftPreview() {
  const seedGalleries = migratedGalleries as PortfolioGallery[]
  const [galleries, setGalleries] = useState(seedGalleries)
  const [settings, setSettings] = useState<WebsiteBuilderSettings>(() => createDefaultWebsiteSettings(seedGalleries))
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    try {
      const savedGalleries = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      const parsedGalleries = savedGalleries ? (JSON.parse(savedGalleries) as PortfolioGallery[]) : null
      const nextGalleries = Array.isArray(parsedGalleries) && parsedGalleries.length > 0 ? parsedGalleries : seedGalleries

      const savedWebsite = window.localStorage.getItem(WEBSITE_BUILDER_STORAGE_KEY)
      let nextSettings = createDefaultWebsiteSettings(nextGalleries)
      let nextHasDraft = false

      if (savedWebsite) {
        const parsedSettings = JSON.parse(savedWebsite) as Partial<WebsiteBuilderSettings>
        nextSettings = { ...nextSettings, ...parsedSettings }
        nextHasDraft = true
      }

      queueMicrotask(() => {
        setGalleries(nextGalleries)
        setSettings(nextSettings)
        setHasDraft(nextHasDraft)
      })
    } catch {
      queueMicrotask(() => setSettings(createDefaultWebsiteSettings(seedGalleries)))
    }
  }, [seedGalleries])

  const featuredGalleries = useMemo(() => {
    const selected = settings.featuredGalleryIds
      .map((galleryId) => galleries.find((gallery) => gallery.id === galleryId))
      .filter(Boolean) as PortfolioGallery[]

    return selected.length > 0 ? selected : galleries.slice(0, 4)
  }, [galleries, settings.featuredGalleryIds])

  const heroCover = featuredGalleries[0]?.cover ?? galleries[0]?.cover
  const theme = websitePreviewThemes[settings.template] ?? defaultPreviewTheme
  const pageClass = theme.pageClass
  const mutedClass = theme.mutedClass
  const borderClass = theme.borderClass
  const cardClass = theme.cardClass
  const navPages = [
    settings.enabledPages.home ? "Home" : null,
    settings.enabledPages.about ? "About" : null,
    settings.enabledPages.gear ? "What's in My Bag" : null,
    settings.enabledPages.blog ? "Trips / Blog" : null,
    settings.enabledPages.articles ? "Articles" : null,
    settings.enabledPages.contact ? "Contact" : null,
    settings.enabledPages.custom ? settings.customPageTitle || "Custom page" : null,
  ].filter(Boolean)

  return (
    <main className={`min-h-screen ${pageClass}`}>
      <div className={`sticky top-0 z-30 border-b ${borderClass} ${theme.headerClass} backdrop-blur`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link className={`flex items-center gap-2 text-sm font-semibold ${mutedClass} hover:text-[#d8a84f]`} href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to builder
          </Link>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${borderClass} ${theme.accentClass}`}>
            Draft preview
          </div>
        </div>
      </div>

      <header className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-md ${theme.logoClass}`}>
            <Camera className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">PhotoViewPro Website</p>
            <p className={`text-xs ${mutedClass}`}>{templateLabels[settings.template]} template</p>
          </div>
        </div>
        <nav className={`flex flex-wrap gap-3 text-sm ${mutedClass}`}>
          {navPages.map((page) => (
            <span className="hover:text-[#d8a84f]" key={page}>
              {page}
            </span>
          ))}
        </nav>
      </header>

      {settings.enabledBlocks.hero && (
        <section className={`mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:items-center ${theme.heroLayoutClass}`}>
          <div className={settings.template === "split-hero" ? "lg:order-1" : ""}>
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.eyebrowClass}`}>Portfolio website preview</p>
            <h1 className={`mt-4 max-w-3xl ${theme.headlineClass}`}>{settings.heroHeadline}</h1>
            <p className={`mt-5 max-w-2xl text-lg leading-8 ${mutedClass}`}>{settings.heroSubhead}</p>
            {settings.enabledBlocks.callToAction && (
              <div className="mt-7 flex flex-wrap gap-3">
                <a className={`rounded-md px-5 py-3 text-sm font-semibold ${theme.ctaClass}`} href="#portfolios">
                  {settings.heroButtonLabel || "View portfolios"}
                </a>
                {settings.enabledPages.contact && (
                  <a className={`rounded-md border px-5 py-3 text-sm font-semibold ${theme.secondaryButtonClass}`} href="#contact">
                    Contact
                  </a>
                )}
              </div>
            )}
          </div>
          <div className={`relative overflow-hidden rounded-md border ${borderClass} ${theme.heroImageClass}`}>
            {heroCover && <Image alt="Website hero preview" className="object-cover" fill priority sizes="(min-width: 1024px) 50vw, 100vw" src={heroCover} unoptimized />}
            <div className={`absolute inset-0 ${theme.heroOverlayClass}`} />
          </div>
        </section>
      )}

      {settings.enabledBlocks.textBlock && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className={`grid gap-5 rounded-md border p-6 md:grid-cols-3 ${borderClass} ${cardClass}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9842d]">About the work</p>
              <h2 className="mt-2 text-2xl font-semibold">Curated portfolios, stories, and field notes in one place.</h2>
            </div>
            <p className={`leading-7 md:col-span-2 ${mutedClass}`}>
              This preview shows how the subscriber&apos;s website can wrap their PhotoViewPro portfolios with a clean homepage, simple navigation, selected pages, and focused calls to action.
            </p>
          </div>
        </section>
      )}

      {settings.enabledBlocks.featuredPortfolio && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9842d]">Featured portfolios</p>
              <h2 className="mt-2 text-3xl font-semibold">Start with the strongest work.</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredGalleries.slice(0, 4).map((gallery) => (
              <Link className={`group overflow-hidden rounded-md border ${borderClass} ${cardClass}`} href={`/g/${gallery.id}`} key={gallery.id}>
                <div className="relative aspect-[4/3] bg-black">
                  <Image alt={gallery.name} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="25vw" src={gallery.cover} unoptimized />
                </div>
                <div className="p-3">
                  <p className="font-semibold">{gallery.name}</p>
                  <p className={`mt-1 text-xs ${mutedClass}`}>{gallery.images} images</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {settings.enabledBlocks.portfolioGrid && (
        <section className="px-5 py-8" id="portfolios">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9842d]">All portfolios</p>
            <h2 className="mt-2 text-3xl font-semibold">Browse the full body of work.</h2>
          </div>
          <PublicPortfolioGrid galleries={galleries} />
        </section>
      )}

      {(settings.enabledBlocks.gear || settings.enabledBlocks.articles || settings.enabledPages.contact) && (
        <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3" id="contact">
          {settings.enabledBlocks.gear && (
            <div className={`rounded-md border p-5 ${borderClass} ${cardClass}`}>
              <ShoppingBag className="size-5 text-[#b9842d]" />
              <h3 className="mt-4 text-xl font-semibold">What&apos;s in my bag</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>Camera gear, travel kit, and affiliate-friendly recommendations.</p>
            </div>
          )}
          {settings.enabledBlocks.articles && (
            <div className={`rounded-md border p-5 ${borderClass} ${cardClass}`}>
              <PenLine className="size-5 text-[#b9842d]" />
              <h3 className="mt-4 text-xl font-semibold">Articles and field notes</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>Useful writing that supports search traffic and gives visitors a reason to return.</p>
            </div>
          )}
          {settings.enabledPages.contact && (
            <div className={`rounded-md border p-5 ${borderClass} ${cardClass}`}>
              <Mail className="size-5 text-[#b9842d]" />
              <h3 className="mt-4 text-xl font-semibold">Contact</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>A clear path for visitors, collaborators, and potential buyers to reach the photographer.</p>
            </div>
          )}
        </section>
      )}

      <footer className={`border-t ${borderClass} px-5 py-8`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between ${mutedClass}`}>
          <p>{hasDraft ? "Previewing saved website draft." : "No saved draft found. Showing the default website preview."}</p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {settings.customDomain || `${settings.subdomain || "yourname"}.photoviewpro.com`}
          </p>
        </div>
      </footer>
    </main>
  )
}
