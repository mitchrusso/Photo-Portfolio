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
  MessageSquare,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  Smartphone,
  Star,
  Upload,
  Users,
} from "lucide-react"
import { BlobUpload } from "@/components/uploads/blob-upload"

const galleries = [
  {
    name: "Hudson Family Session",
    client: "Mia Hudson",
    status: "Proofing",
    privacy: "Private link",
    images: 184,
    favorites: 27,
    revenue: "$420",
    cover:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Westfield Soccer Finals",
    client: "Westfield Athletics",
    status: "For sale",
    privacy: "Password",
    images: 612,
    favorites: 94,
    revenue: "$1,840",
    cover:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Evergreen Product Shoot",
    client: "Evergreen Studio",
    status: "Delivered",
    privacy: "Client portal",
    images: 86,
    favorites: 12,
    revenue: "$0",
    cover:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
  },
]

const proofPicks = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1523438097201-512ae7d59c44?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
]

const navItems = [
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "Galleries", icon: Folder },
  { label: "Uploads", icon: Upload },
  { label: "Clients", icon: Users },
  { label: "Store", icon: ShoppingBag },
  { label: "Mobile", icon: Smartphone },
  { label: "Settings", icon: Settings2 },
]

const tasks = [
  "Publish Westfield pricing",
  "Review 27 Hudson favorites",
  "Send Evergreen download link",
]

export default function Home() {
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
              <button className="flex h-10 items-center gap-2 rounded-md border border-[#d4cdc0] bg-white px-3 text-sm font-medium">
                <ImagePlus className="size-4" />
                New gallery
              </button>
              <BlobUpload mode="button" />
            </div>
          </header>

          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_340px] lg:px-7">
            <section className="min-w-0 space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ["Active galleries", "18", Folder],
                  ["Client favorites", "133", Heart],
                  ["Public shares", "42", Share2],
                  ["Store sales", "$2.3k", ShoppingBag],
                ].map(([label, value, Icon]) => (
                  <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm" key={label as string}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase text-[#777064]">{label as string}</p>
                      <Icon className="size-4 text-[#b08336]" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{value as string}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#e8e1d5] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Working galleries</h2>
                    <p className="text-sm text-[#777064]">The 20% of workflow that drives most delivery decisions.</p>
                  </div>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-[#faf8f4] px-3 text-sm text-[#6f685d]">
                    <Search className="size-4" />
                    Search galleries
                  </div>
                </div>

                <div className="grid gap-4 p-4 xl:grid-cols-3">
                  {galleries.map((gallery) => (
                    <article className="overflow-hidden rounded-md border border-[#e2dbcf] bg-[#fbfaf7]" key={gallery.name}>
                      <div
                        aria-label={`${gallery.name} cover`}
                        className="h-44 bg-cover bg-center"
                        style={{ backgroundImage: `url(${gallery.cover})` }}
                      />
                      <div className="space-y-4 p-4">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold">{gallery.name}</h3>
                            <span className="rounded-full bg-[#e9f1dc] px-2 py-1 text-xs font-medium text-[#466026]">
                              {gallery.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#777064]">{gallery.client}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
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

                        <div className="flex items-center justify-between border-t border-[#e7dfd3] pt-3">
                          <span className="flex items-center gap-1.5 text-xs text-[#6f685d]">
                            <Lock className="size-3.5" />
                            {gallery.privacy}
                          </span>
                          <button className="flex items-center gap-1 text-sm font-medium text-[#735223]">
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
                      <h2 className="text-lg font-semibold">Client proofing queue</h2>
                      <p className="text-sm text-[#777064]">Favorites, comments, and delivery-ready selects.</p>
                    </div>
                    <button className="rounded-md border border-[#d7d0c4] p-2">
                      <MessageSquare className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {proofPicks.map((photo, index) => (
                      <div
                        className="relative h-36 rounded-md bg-cover bg-center"
                        key={photo}
                        style={{ backgroundImage: `url(${photo})` }}
                      >
                        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white">
                          {index + 1} pick{index === 0 ? "" : "s"}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-white/90 p-1.5 text-[#1f2a24]">
                          <Star className="size-3.5 fill-[#d8a84f] text-[#d8a84f]" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-[#ded8cc] bg-[#1f2a24] p-4 text-white shadow-sm">
                  <p className="text-xs font-medium uppercase text-white/55">Share package</p>
                  <h2 className="mt-3 text-lg font-semibold">Hudson delivery link</h2>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Password protected
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Downloads limited to finals
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Print store hidden
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
              <BlobUpload />

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Today&apos;s focus</h2>
                  <Eye className="size-4 text-[#b08336]" />
                </div>
                <div className="mt-4 space-y-3">
                  {tasks.map((task, index) => (
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
                  {[
                    [Globe2, "Visibility", "Unlisted"],
                    [Lock, "Access", "Password"],
                    [Download, "Downloads", "Finals only"],
                    [ShoppingBag, "Sales", "Prints + digital"],
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
                    <div className="h-full rounded-[1.1rem] bg-cover bg-center" style={{ backgroundImage: `url(${galleries[0].cover})` }} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
