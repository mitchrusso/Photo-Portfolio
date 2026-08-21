import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import styles from "./reddit-landing.module.css"

const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

type LandingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  alternates: { canonical: "/for-photographers" },
  description: "Turn your best photography into a beautiful, shareable portfolio. Start your free 14-day PhotoView trial.",
  openGraph: {
    description: "Build a beautiful photography portfolio with PhotoView.io. Free for 14 days.",
    images: [{ alt: "PhotoView.io photography portfolio", height: 630, url: "/opengraph-image", width: 1200 }],
    siteName: "PhotoView.io",
    title: "Your best work deserves more than an endless feed.",
    type: "website",
    url: "https://photoview.io/for-photographers",
  },
  title: "A Portfolio Built for Photographers | PhotoView.io",
  twitter: {
    card: "summary_large_image",
    description: "Build a beautiful photography portfolio with PhotoView.io. Free for 14 days.",
    images: ["/opengraph-image"],
    title: "A Portfolio Built for Photographers | PhotoView.io",
  },
}

const photos = [
  { src: "/marketing-preview/lofoten-aurora.webp", alt: "Aurora above a quiet fishing village in Lofoten" },
  { src: "/marketing-preview/myanmar-temple.webp", alt: "A temple rising through morning mist in Myanmar" },
  { src: "/marketing-preview/egypt-sphinx.webp", alt: "The Sphinx at golden hour in Egypt" },
]

export default async function PhotographerLandingPage({ searchParams }: LandingPageProps) {
  const incomingParams = await searchParams
  const registrationParams = new URLSearchParams()

  for (const key of campaignKeys) {
    const value = incomingParams[key]
    if (typeof value === "string" && value.trim()) registrationParams.set(key, value)
  }

  if (!registrationParams.has("utm_campaign")) registrationParams.set("utm_campaign", "portfolio_for_photographers")
  if (!registrationParams.has("utm_content")) registrationParams.set("utm_content", "landing_page")

  const registerUrl = `/register?${registrationParams.toString()}`

  return (
    <main className={styles.page}>
      <nav className={`${styles.nav} ${styles.shell}`} aria-label="Primary navigation">
        <Link className={styles.brand} href="/" aria-label="PhotoView home">
          <Image src="/brand/photoview-logo-horizontal-transparent.webp" alt="PhotoView.io" width={173} height={44} priority />
        </Link>
        <div className={styles.navActions}>
          <a className={styles.textLink} href="#how-it-works">How it works</a>
          <Link className={`${styles.button} ${styles.buttonSmall}`} href={registerUrl}>Start free</Link>
        </div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> Built for photographers</p>
          <h1>Your best work deserves more than an endless feed.</h1>
          <p className={styles.heroLead}>Turn the photographs you are proudest of into a portfolio that feels intentional—beautiful on every screen, easy to share, and always yours.</p>
          <div className={styles.heroActions}>
            <Link className={styles.button} href={registerUrl}>Start your free 14-day trial <span>→</span></Link>
            <a className={styles.quietLink} href="#how-it-works">See how it works</a>
          </div>
          <p className={styles.microcopy}>No charge today · Plans from $3.99/month · Cancel before your trial ends and pay nothing</p>
        </div>

        <div className={styles.portfolioStage} aria-label="PhotoView portfolio preview">
          <div className={styles.stageTop}><span className={styles.stageLogo}>PhotoView</span><span className={styles.stageMeta}>Northern Light · 2026</span></div>
          <Image className={styles.stageHero} src={photos[0].src} alt={photos[0].alt} width={1200} height={845} priority />
          <div className={styles.stageCaption}><div><span>01</span><strong>Lofoten, Norway</strong></div><p>One quiet night beneath the aurora.</p></div>
          <div className={styles.photoRail} aria-hidden="true">
            {photos.map((photo, index) => <Image key={photo.src} src={photo.src} alt="" width={140} height={98} className={index === 0 ? styles.active : ""} />)}
          </div>
        </div>
      </section>

      <section className={styles.proofBar}><div className={`${styles.shell} ${styles.proofGrid}`}>
        <p><strong>14 days</strong><span>to explore everything</span></p>
        <p><strong>5–150 GB</strong><span>room for curated work</span></p>
        <p><strong>Any screen</strong><span>cinematic desktop, fluid mobile</span></p>
        <p><strong>One link</strong><span>share anywhere</span></p>
      </div></section>

      <section className={`${styles.section} ${styles.shell}`} id="how-it-works">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}><span /> The portfolio, simplified</p>
          <h2>From camera roll to a portfolio you want people to see.</h2>
          <p>No templates to wrestle with. No agency software. Just your photographs, presented with care.</p>
        </div>
        <div className={styles.featureGrid}>
          <article className={`${styles.featureCard} ${styles.largeCard}`}>
            <div className={styles.featureNumber}>01</div>
            <div><h3>Curate with intention</h3><p>Choose covers, reorder images, and hide the frames that do not belong. Your strongest work stays in focus.</p></div>
            <div className={styles.stackedPhotos}><Image src={photos[1].src} alt={photos[1].alt} width={800} height={570} /><Image src={photos[2].src} alt={photos[2].alt} width={800} height={570} /></div>
          </article>
          <article className={`${styles.featureCard} ${styles.darkCard}`}>
            <div className={styles.featureNumber}>02</div>
            <div><h3>Look exceptional everywhere</h3><p>Cinematic desktop layouts and swipe-friendly mobile viewing keep the photograph—not the interface—first.</p></div>
            <div className={styles.phoneMock}><Image src="/marketing-preview/mobile-tree-milky-way.webp" alt="A PhotoView mobile gallery showing the Milky Way" width={500} height={790} /><span>Swipe to explore</span></div>
          </article>
          <article className={`${styles.featureCard} ${styles.wideCard}`}>
            <div className={styles.featureNumber}>03</div>
            <div><h3>Share once. Keep it current.</h3><p>Send a polished link, embed a portfolio on your existing site, or publish from your phone and Lightroom.</p></div>
            <div className={styles.sharePill}>photoview.io/your-name <span>One polished link</span></div>
          </article>
        </div>
      </section>

      <section className={styles.showcase}><div className={`${styles.shell} ${styles.showcaseGrid}`}>
        <div className={styles.showcaseCopy}>
          <p className={`${styles.eyebrow} ${styles.light}`}><span /> A home for the keepers</p>
          <h2>The feed forgets.<br />Your portfolio should not.</h2>
          <p>Build a lasting body of work without turning your photography into a complicated web project.</p>
          <Link className={`${styles.button} ${styles.buttonLight}`} href={registerUrl}>Build your portfolio <span>→</span></Link>
        </div>
        <div className={styles.showcaseImage}><Image src="/marketing-preview/sunset-panorama.webp" alt="A panoramic sunset displayed in PhotoView" width={1400} height={970} /><p><span>Featured collection</span> Chasing the last light</p></div>
      </div></section>

      <section className={`${styles.section} ${styles.shell} ${styles.pricingSection}`}>
        <div className={`${styles.sectionIntro} ${styles.compact}`}>
          <p className={styles.eyebrow}><span /> Simple plans</p>
          <h2>Start small. Let the work grow.</h2>
          <p>Every plan includes the complete portfolio experience. Choose storage based on the body of work you want to publish.</p>
        </div>
        <div className={styles.priceCard}>
          <div><p className={styles.priceLabel}>Starter</p><p className={styles.price}><strong>$3.99</strong><span>/ month</span></p></div>
          <ul><li>5 GB portfolio storage</li><li>Desktop and mobile galleries</li><li>Shareable links and embeds</li><li>14-day free trial</li></ul>
          <div><Link className={styles.button} href={registerUrl}>Start free for 14 days <span>→</span></Link><p>Payment method required. Cancel before the trial ends and you will not be charged.</p></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell} ${styles.faqSection}`}>
        <div className={`${styles.sectionIntro} ${styles.compact}`}><p className={styles.eyebrow}><span /> Questions, answered</p><h2>Everything you need to begin.</h2></div>
        <div className={styles.faqList}>
          <details><summary>Do I need to replace my existing website?<span>+</span></summary><p>No. Use PhotoView as your primary portfolio, share individual collections, or embed your work into the site you already have.</p></details>
          <details><summary>Will I be charged today?<span>+</span></summary><p>No. A payment method starts your 14-day trial, but billing begins only after the trial ends. Cancel before then and you pay nothing.</p></details>
          <details><summary>Can I publish from Lightroom?<span>+</span></summary><p>Yes. PhotoView is designed to fit the way photographers already work, including publishing from Lightroom.</p></details>
        </div>
      </section>

      <section className={styles.finalCta}><div className={`${styles.shell} ${styles.finalCtaInner}`}>
        <p className={`${styles.eyebrow} ${styles.light}`}><span /> Your work is ready</p>
        <h2>Give your photography<br />a beautiful home.</h2>
        <Link className={`${styles.button} ${styles.buttonLight}`} href={registerUrl}>Start your free 14-day trial <span>→</span></Link>
        <p>No charge today. Plans start at $3.99/month after your trial.</p>
      </div></section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <Link className={styles.brand} href="/"><Image src="/brand/photoview-logo-horizontal-transparent.webp" alt="PhotoView.io" width={150} height={38} /></Link>
        <p>Built for photographs worth remembering.</p>
        <div><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div>
      </footer>
    </main>
  )
}
