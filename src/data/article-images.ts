export type ArticleImage = {
  alt: string
  caption: string
  height: number
  src: string
  width: number
}

const blobRoot = "https://rgn4fum6n5kjfahz.public.blob.vercel-storage.com/smugmug"

function portfolioImage(path: string, width: number, height: number, location: string): ArticleImage {
  return {
    alt: `Full-frame portfolio photograph from ${location}`,
    caption: `A photograph from ${location}, presented at its natural proportions without an artificial crop.`,
    height,
    src: `${blobRoot}/${path}`,
    width,
  }
}

export const articleImages: Record<string, ArticleImage> = {
  "one-photo-dashboard-multiple-websites-shopify-embeds": portfolioImage(
    "maine-and-ma/display/vdkrfpg-oct-2024.webp",
    1800,
    892,
    "Maine and Massachusetts",
  ),
  "smart-folders-automatically-update-photo-portfolio-embeds": portfolioImage(
    "tupper-lake/display/tmv9wmq-untitled-4.webp",
    9371,
    6247,
    "Tupper Lake",
  ),
  "build-a-photography-portfolio-with-photos-and-video": portfolioImage(
    "egypt/display/kgqlbfq-egypt-days-1-2-0755.webp",
    8828,
    5463,
    "Egypt",
  ),
  "photo-portfolio-website-vs-client-proofing-gallery": portfolioImage(
    "alabama-hills-and-trona-pinnacles/display/vwjvfmt-mitch-russo-0118.webp",
    4000,
    2250,
    "Alabama Hills",
  ),
  "how-many-photos-should-be-in-a-photography-portfolio": portfolioImage(
    "brazil/display/zhrxtvp-untitled-00402.webp",
    5390,
    3677,
    "Brazil",
  ),
  "embed-a-photography-portfolio-on-your-existing-website": portfolioImage(
    "myanmar/display/k4g22pb-myanmar-gallery-13.webp",
    6886,
    4460,
    "Myanmar",
  ),
  "mobile-photo-import-for-photographers": portfolioImage(
    "moab-night-sky/display/27bhh9v-moab-4049-edit-edit.webp",
    7952,
    5304,
    "Moab",
  ),
  "lightroom-to-online-photo-portfolio-workflow": portfolioImage(
    "lofoten-norway/display/kgrg7bl-norway-day-3-1032.webp",
    6262,
    4531,
    "Lofoten, Norway",
  ),
  "best-photo-gallery-platform-for-portfolio-first-photographers": portfolioImage(
    "greenland/display/jt6q9xk-greenland-6157.webp",
    7520,
    3901,
    "Greenland",
  ),
  "telephoto-lens-techniques-for-wildlife-photography": portfolioImage(
    "iceland/display/bgv62rx-viking-ship-converted.webp",
    5611,
    3741,
    "Iceland",
  ),
  "best-camera-settings-for-outdoor-portrait-photography": portfolioImage(
    "slovenia/display/swcfwj3-ljubljana-church.webp",
    2500,
    1165,
    "Slovenia",
  ),
  "how-to-use-natural-light-for-portrait-photography": portfolioImage(
    "new-zealand/display/vt4jdf3-pano-church-auckland-nz-33261-2-3-4-5.webp",
    7849,
    3011,
    "New Zealand",
  ),
  "long-exposure-landscape-photography-tips": portfolioImage(
    "jordan/display/b2qt6cg-jordan-7602-hdr.webp",
    5614,
    3741,
    "Jordan",
  ),
  "prime-vs-zoom-lens-for-portrait-photographers": portfolioImage(
    "bhutan/display/gw3dtjg-thailand-bangkok-7956.webp",
    5582,
    3147,
    "Bhutan",
  ),
  "weather-sealed-camera-bodies-for-outdoor-photographers": portfolioImage(
    "chicago/display/c3nqzlf-chicago-sm-gallery.webp",
    5716,
    3814,
    "Chicago",
  ),
  "how-to-edit-portrait-photos-in-lightroom": portfolioImage(
    "joshua-tree-national-park/display/gdx2crc-joshua-tree-31763-edit.webp",
    4577,
    2758,
    "Joshua Tree National Park",
  ),
  "wildlife-photo-culling-and-editing-workflow": portfolioImage(
    "terlingua-tx/display/r9trqdr-chicago-sm-gallery.webp",
    7952,
    5304,
    "Terlingua, Texas",
  ),
  "landscape-photo-color-grading-techniques": portfolioImage(
    "night-photos-eastern-sierras/display/b6psrpg-ca-yosemite-596.webp",
    5616,
    3180,
    "the Eastern Sierra",
  ),
  "how-to-track-and-approach-wildlife-safely-for-photography": portfolioImage(
    "death-valley-at-night/display/w4gkqxc-death-valley-day-3-115.webp",
    5541,
    3694,
    "Death Valley",
  ),
  "how-to-get-photography-permits-for-national-parks-in-the-usa": portfolioImage(
    "nevada-ghost-towns/display/7dqhbt6-untitled.webp",
    10862,
    4825,
    "Nevada",
  ),
}

export function getArticleImage(slug: string) {
  return articleImages[slug]
}
