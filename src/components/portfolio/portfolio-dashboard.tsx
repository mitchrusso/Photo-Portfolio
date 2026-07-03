"use client"

import {
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  Folder,
  Globe2,
  Heart,
  ImagePlus,
  Link2,
  Lock,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  Smartphone,
  Upload,
  Users,
  X,
} from "lucide-react"
import Image from "next/image"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { BlobUpload } from "@/components/uploads/blob-upload"

type Gallery = {
  id: string
  name: string
  client: string
  status: "Draft" | "Proofing" | "For sale" | "Delivered"
  privacy: "Private link" | "Password" | "Client portal" | "Public"
  images: number
  favorites: number
  revenue: string
  cover: string
  description: string
  url?: string
}

const seedGalleries: Gallery[] = [
  {
    id: "myanmar",
    name: "Myanmar",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Myanmar/i-K4G22PB/0/LqQhsr2zkn3HQvXLrhnQQV2L5kScHq6chTpPVHLwv/L/Myanmar%20Gallery-13-L.jpg",
    description: "Travels through Myanmar from Nov 5 - 18",
    url: "https://lenstraveler18.smugmug.com/Travel/Myanmar/",
  },
  {
    id: "moab-night-sky",
    name: "Moab Night Sky",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Moab-Night-Sky/i-27bhH9v/0/MD6tmFbV6Fp5KPcsJzvhvBGk7X9CHpnJB6QxwLLJ7/L/Moab-4049-Edit-Edit-L.jpg",
    description: "From Moab, I travel through the National parks and photograph",
    url: "https://lenstraveler18.smugmug.com/Travel/Moab-Night-Sky/",
  },
  {
    id: "lofoten-norway",
    name: "Lofoten, Norway",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Lofoten-Norway/i-kgRg7BL/0/MMB2qdPPfmfm92fXV6mCHHCqzqG4GzBVm9w3j5GLL/L/Norway%20Day%203-1032-L.jpg",
    description: "Winter landscape",
    url: "https://lenstraveler18.smugmug.com/Travel/Lofoten-Norway/",
  },
  {
    id: "greenland",
    name: "Greenland",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Greenland/i-jT6q9XK/2/NK3jLHkzHt67Ct9gFXJL4jD9hbF7GgC9L35xsV7Q5/L/Greenland-6157-L.jpg",
    description: "August 2016 visit to Greenland",
    url: "https://lenstraveler18.smugmug.com/Travel/Greenland",
  },
  {
    id: "iceland",
    name: "Iceland",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Terlingua/i-nMNn54N/0/KnjNkQxrvWvNwbK2326S3j7JQHdBvJ3R2tx3xPPhP/XL/Chicago%20SM%20gallery-6-XL.jpg",
    description: "Imported from the public SmugMug Travel navigation.",
    url: "https://lenstraveler18.smugmug.com/Iceland",
  },
  {
    id: "slovenia",
    name: "Slovenia",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Slovenia/i-6xHNQmd/0/KK76LCrbx3WHFrMt3NPFbr7KPpzQFZxPhf9TmV9Mk/L/SmugMug%20Slovenia2--L.jpg",
    description: "Mitch Russo Travels to Slovenia and tours the natural beauty of this hidden gem.",
    url: "https://lenstraveler18.smugmug.com/Travel/Slovenia",
  },
  {
    id: "jordan",
    name: "Jordan",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Jordan/i-DL8txrS/3/LfTDJXpzWNkNGrdhF6snkmqb5zcSVsx5Zzs6nmCqb/L/Jordan-Petra-7921-L.jpg",
    description: "Photographs made in November 2012 from my visit to Petra, Wadi Rum and Amman.",
    url: "https://lenstraveler18.smugmug.com/Travel/Jordan",
  },
  {
    id: "terlingua-tx",
    name: "Terlingua, TX",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Terlingua/i-nMNn54N/0/MRdhhzJ9CHFHL2wzFS2ZVm2kT8cJG4MVLmF2sSxm3/L/Chicago%20SM%20gallery-6-L.jpg",
    description: "Imported from the public SmugMug Travel gallery.",
    url: "https://lenstraveler18.smugmug.com/Travel/Terlingua",
  },
  {
    id: "nevada-ghost-towns",
    name: "Nevada Ghost Towns",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Nevada-Ghost-Towns/i-SG7Kr2h/0/KzVCVj37Bmk8xK4pv4ndB2g5BftnB6NdCSTTFdtrj/L/untitled-10-L.jpg",
    description: "Imported from the public SmugMug Travel gallery.",
    url: "https://lenstraveler18.smugmug.com/Travel/Nevada-Ghost-Towns",
  },
  {
    id: "death-valley-at-night",
    name: "Death Valley at Night",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Death-Valley-at-Night/i-pnMCCnG/2/LZVWs4GLtnsdMbWLScrSBXJCCq8cBmcbW3gLVZMs2/L/CA%20-%20Death%20Valley-0150-L.jpg",
    description: "November 2010 in Death Valley, CA Under heavy winds it was a challenge.",
    url: "https://lenstraveler18.smugmug.com/Travel/Death-Valley-at-Night",
  },
  {
    id: "night-photos-eastern-sierras",
    name: "Night Photos Eastern Sierras",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Night-Photos-Eastern-Sierras/i-9fS2Pj9/5/MQgsrqCgWJttk9J9mjz2P95657bB7Fm4q723QPZr3/L/CA%20-%20Yosemite-177-L.jpg",
    description: "Images taken over 4 nights during late May 2010 in the Eastern Sierras.",
    url: "https://lenstraveler18.smugmug.com/Travel/Night-Photos-Eastern-Sierras",
  },
  {
    id: "bhutan",
    name: "Bhutan",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/BangkokBhutan-2009/i-Dc6vvh9/0/MHSNSM7qRn9BJSH7W3Q5cspDwFZgVs87ftfhdGDBX/L/_MG_9200-L.jpg",
    description: "An October 2009 journey through an enchanted land.",
    url: "https://lenstraveler18.smugmug.com/Travel/BangkokBhutan-2009",
  },
  {
    id: "bodie-ghost-town",
    name: "Bodie Ghost Town",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Bodie-Ghost-Town/i-BPqxG8J/2/LPf3K7Cn7gghJSJd34cFR65zr63b9xW2QnGvdrwFr/L/CA%20-%20Bodie%20Ghost%20Town-4-L.jpg",
    description: "Imported from the public SmugMug Travel gallery.",
    url: "https://lenstraveler18.smugmug.com/Travel/Bodie-Ghost-Town",
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/New-Zealand/i-bx2Pkk2/3/MF4qkC8ZrN94sf5kttcPRc6Nr9qCNqxR6x9CpP3tt/L/NZ-33974-L.jpg",
    description: "Imported from the public SmugMug Travel gallery.",
    url: "https://lenstraveler18.smugmug.com/Travel/New-Zealand",
  },
  {
    id: "italy",
    name: "Italy",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Italy/i-m6MrTmw/1/McCFL8qkk5jXPbbw3RDxmpFkTcs9HB6SkQWfN22dZ/L/_MG_7798_799_800%20-%20ENHANCED%20Ponte%20Vecchio%20from%20museum%20window-L.jpg",
    description: "Italy is one big post card, everything is so beautiful.",
    url: "https://lenstraveler18.smugmug.com/Travel/Italy",
  },
  {
    id: "joshua-tree-national-park",
    name: "Joshua Tree",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Joshua-Tree-National-Park/i-JnpM8DX/0/K9GprrdskgGJrBGmjdp9J8L9JRDsGwKvkbcXjbHZk/L/Hi%20Rez%20JT%20for%20smugmug-4-L.jpg",
    description: "Imported from the public SmugMug Travel gallery.",
    url: "https://lenstraveler18.smugmug.com/Travel/Joshua-Tree-National-Park",
  },
  {
    id: "chicago",
    name: "Chicago",
    client: "Mitch Russo Travels",
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover: "https://photos.smugmug.com/Travel/Chicago/i-Hht3RB4/0/MCKZ7Jn9S8jVvNT64RChts5J8QTZxp3RxkCZTjbL4/L/Chicago%20SM%20gallery-11-L.jpg",
    description: "Imported from the public SmugMug Travel gallery.",
    url: "https://lenstraveler18.smugmug.com/Travel/Chicago/",
  },
]

const coverOptions = seedGalleries.map((gallery) => gallery.cover)

const navItems = [
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "Galleries", icon: Folder },
  { label: "Uploads", icon: Upload },
  { label: "Clients", icon: Users },
  { label: "Store", icon: ShoppingBag },
  { label: "Mobile", icon: Smartphone },
  { label: "Settings", icon: Settings2 },
]

const GALLERY_STORAGE_KEY = "photo-portfolio-galleries-v3"

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function PortfolioDashboard() {
  const [galleries, setGalleries] = useState(seedGalleries)
  const [activeGalleryId, setActiveGalleryId] = useState(seedGalleries[0].id)
  const [search, setSearch] = useState("")
  const [showNewGallery, setShowNewGallery] = useState(false)
  const [hasLoadedSavedGalleries, setHasLoadedSavedGalleries] = useState(false)
  const [pendingCovers, setPendingCovers] = useState<Record<string, string>>({})
  const activeGallery = galleries.find((gallery) => gallery.id === activeGalleryId) ?? galleries[0]
  const pendingCover = pendingCovers[activeGallery.id] ?? activeGallery.cover

  useEffect(() => {
    queueMicrotask(() => {
      const saved = window.localStorage.getItem(GALLERY_STORAGE_KEY)

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Gallery[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGalleries(parsed)
            setActiveGalleryId(parsed[0].id)
          }
        } catch {
          window.localStorage.removeItem(GALLERY_STORAGE_KEY)
        }
      }

      setHasLoadedSavedGalleries(true)
    })
  }, [])

  useEffect(() => {
    if (hasLoadedSavedGalleries) {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleries))
    }
  }, [galleries, hasLoadedSavedGalleries])

  const filteredGalleries = galleries.filter((gallery) => {
    const value = `${gallery.name} ${gallery.client} ${gallery.status}`.toLowerCase()
    return value.includes(search.toLowerCase())
  })

  const metrics = useMemo(() => {
    const images = galleries.reduce((sum, gallery) => sum + gallery.images, 0)
    const favorites = galleries.reduce((sum, gallery) => sum + gallery.favorites, 0)
    const publicShares = galleries.filter((gallery) => gallery.privacy !== "Client portal").length
    return [
      ["Active galleries", String(galleries.length), Folder],
      ["Total images", images.toLocaleString(), Camera],
      ["Client favorites", favorites.toLocaleString(), Heart],
      ["Public shares", String(publicShares), Share2],
    ] as const
  }, [galleries])

  function addGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const client = String(formData.get("client") ?? "").trim()
    const status = String(formData.get("status") ?? "Draft") as Gallery["status"]

    if (!name) return

    const idBase = slugify(name) || `gallery-${Date.now()}`
    const id = galleries.some((gallery) => gallery.id === idBase) ? `${idBase}-${Date.now()}` : idBase
    const gallery: Gallery = {
      id,
      name,
      client: client || "Personal",
      status,
      privacy: "Private link",
      images: 0,
      favorites: 0,
      revenue: "$0",
      cover: activeGallery.cover,
      description: "New portfolio gallery ready for uploads, proofing, and sharing.",
    }

    setGalleries((current) => [gallery, ...current])
    setActiveGalleryId(id)
    setShowNewGallery(false)
    event.currentTarget.reset()
  }

  function updateActiveGallery(updates: Partial<Gallery>) {
    setGalleries((current) =>
      current.map((gallery) =>
        gallery.id === activeGallery.id ? { ...gallery, ...updates } : gallery,
      ),
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#1e211d]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#ded8cc] bg-[#151714] px-5 py-5 text-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-[#161713]">
                <Camera className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Photo-Portfolio</p>
                <p className="text-xs text-white/55">Personal studio OS</p>
              </div>
            </div>
            <button className="rounded-md border border-white/15 p-2 text-white/80 lg:hidden">
              <Search className="size-4" />
            </button>
          </div>

          <nav className="mt-7 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navItems.map((item) => (
              <button
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                  item.active
                    ? "bg-white text-[#171814]"
                    : "text-white/68 hover:bg-white/10 hover:text-white"
                }`}
                key={item.label}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-7 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-medium uppercase text-white/45">Storage</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-2xl font-semibold">1.8 TB</span>
              <Cloud className="size-5 text-[#d8a84f]" />
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10">
              <div className="h-full w-[58%] rounded-full bg-[#d8a84f]" />
            </div>
            <p className="mt-3 text-xs text-white/55">Originals, web proofs, and client exports</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-4 border-b border-[#ded8cc] bg-[#f9f7f2]/85 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-7">
            <div>
              <p className="text-sm text-[#777064]">Friday pipeline</p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                Galleries, clients, and delivery in one place
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex h-10 items-center gap-2 rounded-md border border-[#d4cdc0] bg-white px-3 text-sm font-medium"
                onClick={() => setShowNewGallery(true)}
                type="button"
              >
                <ImagePlus className="size-4" />
                New gallery
              </button>
              <BlobUpload galleryId={activeGallery.id} mode="button" />
            </div>
          </header>

          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_340px] lg:px-7">
            <section className="min-w-0 space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                {metrics.map(([label, value, Icon]) => (
                  <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm" key={label}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase text-[#777064]">{label}</p>
                      <Icon className="size-4 text-[#b08336]" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#e8e1d5] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Portfolio galleries</h2>
                    <p className="text-sm text-[#777064]">Gallery cards, portfolio preview, proofing, and delivery controls.</p>
                  </div>
                  <label className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-[#faf8f4] px-3 text-sm text-[#6f685d]">
                    <Search className="size-4" />
                    <input
                      className="w-40 bg-transparent outline-none placeholder:text-[#9a9287]"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search galleries"
                      type="search"
                      value={search}
                    />
                  </label>
                </div>

                <div className="grid gap-4 p-4 xl:grid-cols-3">
                  {filteredGalleries.map((gallery) => (
                    <article
                      className={`overflow-hidden rounded-md border bg-[#fbfaf7] ${
                        gallery.id === activeGallery.id ? "border-[#b08336] ring-2 ring-[#ead29b]" : "border-[#e2dbcf]"
                      }`}
                      key={gallery.id}
                    >
                      <button
                        aria-label={`Open ${gallery.name}`}
                        className="relative block aspect-[3/2] w-full bg-[#f1eee8]"
                        onClick={() => setActiveGalleryId(gallery.id)}
                        type="button"
                      >
                        <Image
                          alt={`${gallery.name} cover`}
                          className="object-contain"
                          fill
                          sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 90vw"
                          src={gallery.cover}
                        />
                      </button>
                      <div className="space-y-2 p-3">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold">{gallery.name}</h3>
                            <span className="rounded-full bg-[#e9f1dc] px-2 py-0.5 text-[11px] font-medium text-[#466026]">
                              {gallery.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#777064]">{gallery.client}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#827a70]">Images</p>
                            <p className="font-semibold">{gallery.images}</p>
                          </div>
                          <div>
                            <p className="text-[#827a70]">Picks</p>
                            <p className="font-semibold">{gallery.favorites}</p>
                          </div>
                          <div>
                            <p className="text-[#827a70]">Sales</p>
                            <p className="font-semibold">{gallery.revenue}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#e7dfd3] pt-2">
                          <span className="flex items-center gap-1 text-[11px] text-[#6f685d]">
                            <Lock className="size-3.5" />
                            {gallery.privacy}
                          </span>
                          <button
                            className="flex items-center gap-1 text-xs font-medium text-[#735223]"
                            onClick={() => setActiveGalleryId(gallery.id)}
                            type="button"
                          >
                            Open
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
                <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Portfolio view</h2>
                      <p className="text-sm text-[#777064]">{activeGallery.description}</p>
                    </div>
                    <button className="rounded-md border border-[#d7d0c4] p-2">
                      <Eye className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-md border border-[#e5ded2] bg-[#fbfaf7]">
                    <div className="relative aspect-[16/10] max-h-[520px] min-h-72 bg-[#f1eee8]">
                      <Image
                        alt={`${activeGallery.name} cover`}
                        className="object-contain"
                        fill
                        sizes="(min-width: 1280px) 55vw, 90vw"
                        src={activeGallery.cover}
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{activeGallery.name}</h3>
                        <p className="mt-1 text-sm text-[#777064]">{activeGallery.client}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeGallery.url && (
                          <a
                            className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-medium"
                            href={activeGallery.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Globe2 className="size-4" />
                            Source
                          </a>
                        )}
                        <button className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-medium">
                          <Share2 className="size-4" />
                          Share
                        </button>
                        <button className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white">
                          <Download className="size-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-[#ded8cc] bg-[#1f2a24] p-4 text-white shadow-sm">
                  <p className="text-xs font-medium uppercase text-white/55">Share package</p>
                  <h2 className="mt-3 text-lg font-semibold">{activeGallery.name}</h2>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      {activeGallery.privacy} enabled
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Downloads limited to finals
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Portfolio preview ready
                    </p>
                  </div>
                  <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-[#1f2a24]">
                    <Link2 className="size-4" />
                    Copy link
                  </button>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <BlobUpload galleryId={activeGallery.id} />

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Today&apos;s focus</h2>
                  <Eye className="size-4 text-[#b08336]" />
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    `Upload originals to ${activeGallery.name}`,
                    `Review ${activeGallery.name} portfolio details`,
                    `Confirm ${activeGallery.privacy.toLowerCase()} access`,
                  ].map((task, index) => (
                    <div className="flex items-center gap-3 rounded-md bg-[#f6f2ea] p-3" key={task}>
                      <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#735223]">
                        {index + 1}
                      </span>
                      <span className="text-sm">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold">Gallery controls</h2>
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Lock className="size-4 text-[#99702d]" />
                      Access
                    </span>
                    <select
                      className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2 text-sm font-normal outline-none focus:border-[#b08336]"
                      onChange={(event) => updateActiveGallery({ privacy: event.target.value as Gallery["privacy"] })}
                      value={activeGallery.privacy}
                    >
                      <option>Private link</option>
                      <option>Password</option>
                      <option>Client portal</option>
                      <option>Public</option>
                    </select>
                  </label>

                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Globe2 className="size-4 text-[#99702d]" />
                      Visibility
                    </span>
                    <span className="text-sm font-normal text-[#777064]">
                      {activeGallery.privacy === "Public" ? "Public" : "Unlisted"}
                    </span>
                  </label>

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <ImagePlus className="size-4 text-[#99702d]" />
                      Cover photo
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {coverOptions.map((cover, index) => (
                        <button
                          aria-label={`Assign cover ${index + 1}`}
                          className={`relative aspect-[3/2] overflow-hidden rounded-md border ${
                            pendingCover === cover ? "border-[#b08336] ring-2 ring-[#ead29b]" : "border-[#ded8cc]"
                          }`}
                          key={cover}
                          onClick={() =>
                            setPendingCovers((current) => ({
                              ...current,
                              [activeGallery.id]: cover,
                            }))
                          }
                          type="button"
                        >
                          <Image
                            alt={`Cover option ${index + 1}`}
                            className="object-cover"
                            fill
                            sizes="90px"
                            src={cover}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      className="mt-3 h-9 w-full rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                      onClick={() => updateActiveGallery({ cover: pendingCover })}
                      type="button"
                    >
                      Assign cover photo
                    </button>
                  </div>

                  {[
                    [Download, "Downloads", "Finals only"],
                    [ShoppingBag, "Sales", activeGallery.status === "For sale" ? "Prints + digital" : "Hidden"],
                  ].map(([Icon, label, value]) => (
                    <div className="flex items-center justify-between rounded-md border border-[#e5ded2] p-3" key={label as string}>
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-[#99702d]" />
                        <span className="text-sm font-medium">{label as string}</span>
                      </div>
                      <span className="text-sm text-[#777064]">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold">Mobile companion</h2>
                <p className="mt-2 text-sm text-[#777064]">
                  Keep the mobile app focused on uploads, quick organizing, offline showing, and share links.
                </p>
                <div className="mt-4 rounded-md bg-[#f3ead9] p-4">
                  <div className="mx-auto h-52 w-28 rounded-[1.6rem] border-4 border-[#1f2a24] bg-[#1f2a24] p-2">
                    <div className="h-full rounded-[1.1rem] bg-cover bg-center" style={{ backgroundImage: `url(${activeGallery.cover})` }} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {showNewGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form className="w-full max-w-xl rounded-md bg-white p-5 shadow-xl" onSubmit={addGallery}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">New gallery</h2>
                <p className="mt-1 text-sm text-[#777064]">Create a portfolio gallery and start uploading into it.</p>
              </div>
              <button
                aria-label="Close new gallery"
                className="rounded-md border border-[#d7d0c4] p-2"
                onClick={() => setShowNewGallery(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Gallery name
                <input
                  className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
                  name="name"
                  placeholder="Downtown portrait session"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Client
                <input
                  className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
                  name="client"
                  placeholder="Client or organization"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Status
                <select className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]" name="status">
                  <option>Draft</option>
                  <option>Proofing</option>
                  <option>For sale</option>
                  <option>Delivered</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-medium"
                onClick={() => setShowNewGallery(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="h-10 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white" type="submit">
                Add gallery
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
