"use client"

import {
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  Tag,
  ThumbsUp,
  Trophy,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { publicGalleryPath } from "@/lib/gallery-utils"
import {
  showcaseCategories,
  SHOWCASE_COMMENTS_STORAGE_KEY,
  SHOWCASE_SUBMISSIONS_STORAGE_KEY,
  SHOWCASE_VOTES_STORAGE_KEY,
  showcaseTopics,
  type ShowcasePhoto,
} from "@/lib/showcase-utils"

type ShowcaseComment = {
  body: string
  createdAt: string
  id: string
  name: string
  photoId: string
}

type ShowcasePageProps = {
  photos: ShowcasePhoto[]
}

const SHOWCASE_RECENT_CUTOFF_MS = Date.UTC(2026, 5, 28)

function readStoredItems<T>(key: string): T[] {
  if (typeof window === "undefined") return []

  try {
    const saved = window.localStorage.getItem(key)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function ShowcasePage({ photos }: ShowcasePageProps) {
  const [category, setCategory] = useState<(typeof showcaseCategories)[number]>("All")
  const [topic, setTopic] = useState<(typeof showcaseTopics)[number]>("All")
  const [query, setQuery] = useState("")
  const [submittedPhotos, setSubmittedPhotos] = useState<ShowcasePhoto[]>([])
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [comments, setComments] = useState<ShowcaseComment[]>([])
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
  const [commentName, setCommentName] = useState("")
  const [commentBody, setCommentBody] = useState("")

  useEffect(() => {
    queueMicrotask(() => {
      setSubmittedPhotos(readStoredItems<ShowcasePhoto>(SHOWCASE_SUBMISSIONS_STORAGE_KEY))
      setVotedIds(readStoredItems<string>(SHOWCASE_VOTES_STORAGE_KEY))
      setComments(readStoredItems<ShowcaseComment>(SHOWCASE_COMMENTS_STORAGE_KEY))
    })
  }, [])

  const approvedSubmissions = submittedPhotos.filter((photo) => photo.status === "Approved" || photo.status === "Featured")
  const allPhotos = useMemo(() => [...approvedSubmissions, ...photos], [approvedSubmissions, photos])
  const activePhoto = allPhotos.find((photo) => photo.id === activePhotoId)
  const filteredPhotos = allPhotos
    .filter((photo) => category === "All" || photo.category === category)
    .filter((photo) => {
      if (topic === "All") return true
      if (topic === "Editor's Picks") return photo.status === "Featured"
      if (topic === "Most Loved") return photo.votes + (votedIds.includes(photo.id) ? 1 : 0) >= 45
      if (topic === "New This Week") return new Date(photo.submittedAt).getTime() > SHOWCASE_RECENT_CUTOFF_MS
      if (topic === "Mobile Friendly") return true
      return true
    })
    .filter((photo) => {
      const search = query.trim().toLowerCase()
      if (!search) return true
      return [photo.title, photo.photographer, photo.portfolioName, photo.category, photo.location, ...photo.tags]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    })
    .sort((a, b) => {
      if (topic === "Most Loved") return b.votes - a.votes
      if (a.status === "Featured" && b.status !== "Featured") return -1
      if (b.status === "Featured" && a.status !== "Featured") return 1
      return b.votes - a.votes
    })

  function voteFor(photoId: string) {
    if (votedIds.includes(photoId)) return

    const nextVotes = [...votedIds, photoId]
    setVotedIds(nextVotes)
    window.localStorage.setItem(SHOWCASE_VOTES_STORAGE_KEY, JSON.stringify(nextVotes))
  }

  async function sharePhoto(photo: ShowcasePhoto) {
    const url = `${window.location.origin}/showcase?photo=${encodeURIComponent(photo.id)}`
    const text = `${photo.title} by ${photo.photographer} on PhotoViewPro Showcase`

    if (navigator.share) {
      await navigator.share({ title: photo.title, text, url }).catch(() => undefined)
      return
    }

    await navigator.clipboard?.writeText(`${text}\n${url}`)
  }

  function addComment() {
    if (!activePhoto || !commentBody.trim()) return

    const now = new Date()
    const comment: ShowcaseComment = {
      body: commentBody.trim(),
      createdAt: now.toISOString(),
      id: `comment-${now.getTime()}`,
      name: commentName.trim() || "Visitor",
      photoId: activePhoto.id,
    }
    const nextComments = [comment, ...comments]
    setComments(nextComments)
    setCommentBody("")
    window.localStorage.setItem(SHOWCASE_COMMENTS_STORAGE_KEY, JSON.stringify(nextComments))
  }

  return (
    <section className="px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">PhotoViewPro Showcase</p>
            <h1 className="mt-3 text-4xl font-semibold md:text-6xl">A public gallery for curated photographer work.</h1>
          </div>
          <div>
            <p className="text-base leading-8 text-white/62">
              Subscribers can submit selected images from their portfolios. Visitors can browse by category, search topics and tags, vote for favorites, comment, and share PhotoViewPro-branded links back to the photographer.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Approved images", allPhotos.length.toLocaleString()],
                ["Votes cast", allPhotos.reduce((sum, photo) => sum + photo.votes, votedIds.length).toLocaleString()],
                ["Categories", showcaseCategories.length - 1],
              ].map(([label, value]) => (
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3" key={label}>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 xl:grid-cols-[1fr_auto_auto]">
          <label className="flex h-11 min-w-0 items-center gap-3 rounded-md border border-white/10 bg-black px-3 text-sm text-white">
            <Search className="size-4 text-white/45" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/35"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by photo, tag, category, location, photographer..."
              value={query}
            />
          </label>
          <select
            className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none"
            onChange={(event) => setCategory(event.target.value as typeof category)}
            value={category}
          >
            {showcaseCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none"
            onChange={(event) => setTopic(event.target.value as typeof topic)}
            value={topic}
          >
            {showcaseTopics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredPhotos.map((photo) => {
            const isVoted = votedIds.includes(photo.id)
            const photoComments = comments.filter((comment) => comment.photoId === photo.id)

            return (
              <article className="overflow-hidden rounded-md border border-white/10 bg-[#070707]" key={photo.id}>
                <button
                  className="group relative block aspect-[4/3] w-full bg-black"
                  onClick={() => setActivePhotoId(photo.id)}
                  type="button"
                >
                  <Image
                    alt={photo.title}
                    className="object-cover transition duration-300 group-hover:scale-[1.025]"
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    src={photo.imageUrl}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 text-left">
                    <div className="flex items-center gap-2">
                      {photo.status === "Featured" && (
                        <span className="flex items-center gap-1 rounded-full bg-[#d8a84f] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
                          <Trophy className="size-3" />
                          Featured
                        </span>
                      )}
                      <span className="rounded-full border border-white/20 bg-black/45 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/75">
                        {photo.category}
                      </span>
                    </div>
                    <h2 className="mt-3 line-clamp-1 text-lg font-semibold text-white">{photo.title}</h2>
                    <p className="mt-1 text-sm text-white/58">{photo.photographer}</p>
                  </div>
                </button>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.slice(0, 3).map((tag) => (
                      <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-xs text-white/58" key={tag}>
                        <Tag className="size-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Link className="text-sm font-semibold text-[#d8a84f] hover:text-white" href={publicGalleryPath(photo.portfolioId, photo.workspaceSlug)}>
                      Open portfolio
                    </Link>
                    <div className="flex gap-2">
                      <button
                        className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                          isVoted ? "bg-[#d8a84f] text-black" : "border border-white/10 text-white hover:bg-white/10"
                        }`}
                        onClick={() => voteFor(photo.id)}
                        type="button"
                      >
                        <ThumbsUp className="size-4" />
                        {photo.votes + (isVoted ? 1 : 0)}
                      </button>
                      <button
                        className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-white hover:bg-white/10"
                        onClick={() => setActivePhotoId(photo.id)}
                        type="button"
                      >
                        <MessageCircle className="size-4" />
                        {photo.comments + photoComments.length}
                      </button>
                      <button
                        className="flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-white hover:bg-white/10"
                        onClick={() => void sharePhoto(photo)}
                        type="button"
                      >
                        <Share2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="mt-8 rounded-md border border-white/10 bg-white/[0.04] p-8 text-center">
            <Sparkles className="mx-auto size-8 text-[#d8a84f]" />
            <p className="mt-4 text-lg font-semibold">No photos match those filters yet.</p>
            <p className="mt-2 text-sm text-white/55">Try another category, topic, or tag.</p>
          </div>
        )}
      </div>

      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/88 p-4 backdrop-blur">
          <div className="mx-auto grid h-full max-w-6xl gap-4 lg:grid-cols-[1fr_360px]">
            <button
              aria-label="Close showcase photo"
              className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/15 bg-black text-2xl text-white"
              onClick={() => setActivePhotoId(null)}
              type="button"
            >
              ×
            </button>
            <div className="relative min-h-[50vh] overflow-hidden rounded-md bg-black">
              <Image alt={activePhoto.title} className="object-contain" fill sizes="70vw" src={activePhoto.imageUrl} />
            </div>
            <aside className="overflow-y-auto rounded-md border border-white/10 bg-[#080808] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#d8a84f]">{activePhoto.category}</p>
              <h2 className="mt-2 text-2xl font-semibold">{activePhoto.title}</h2>
              <p className="mt-2 text-sm text-white/58">
                By {activePhoto.photographer} from <Link className="text-[#d8a84f]" href={publicGalleryPath(activePhoto.portfolioId, activePhoto.workspaceSlug)}>{activePhoto.portfolioName}</Link>
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-semibold ${
                    votedIds.includes(activePhoto.id) ? "bg-[#d8a84f] text-black" : "border border-white/10 text-white"
                  }`}
                  onClick={() => voteFor(activePhoto.id)}
                  type="button"
                >
                  <ThumbsUp className="size-4" />
                  Vote
                </button>
                <button
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-white/10 text-sm text-white"
                  onClick={() => void sharePhoto(activePhoto)}
                  type="button"
                >
                  <Share2 className="size-4" />
                  Share
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {activePhoto.tags.map((tag) => (
                  <button
                    className="rounded-full bg-white/[0.06] px-2 py-1 text-xs text-white/62"
                    key={tag}
                    onClick={() => {
                      setQuery(tag)
                      setActivePhotoId(null)
                    }}
                    type="button"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="font-semibold">Comments</h3>
                <div className="mt-3 grid gap-2">
                  <input
                    className="h-10 rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none"
                    onChange={(event) => setCommentName(event.target.value)}
                    placeholder="Your name"
                    value={commentName}
                  />
                  <textarea
                    className="min-h-24 rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Add a respectful comment..."
                    value={commentBody}
                  />
                  <button className="h-10 rounded-md bg-white text-sm font-semibold text-black" onClick={addComment} type="button">
                    Post comment
                  </button>
                </div>
                <div className="mt-5 grid gap-3">
                  {comments.filter((comment) => comment.photoId === activePhoto.id).map((comment) => (
                    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3" key={comment.id}>
                      <p className="text-sm font-semibold">{comment.name}</p>
                      <p className="mt-1 text-sm leading-6 text-white/62">{comment.body}</p>
                    </div>
                  ))}
                  {comments.filter((comment) => comment.photoId === activePhoto.id).length === 0 && (
                    <p className="text-sm text-white/45">No visitor comments yet.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  )
}
