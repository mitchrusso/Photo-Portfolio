export const marketingFaqs = [
  {
    question: "Is PhotoView a photo editor?",
    answer: "No. PhotoView is the presentation and publishing home for work you have already finished in Lightroom, Capture One, Photoshop, or another editor.",
  },
  {
    question: "Do I still need a proofing or delivery tool?",
    answer: "Yes, if your business needs client proofing, print sales, contracts, invoicing, or studio management. PhotoView is focused on storing, curating, displaying, and sharing finished photography and video.",
  },
  {
    question: "Is my card charged today?",
    answer: "No. A payment method starts your 14-day free trial, but you are not charged until day 14. Cancel before day 14 and pay nothing.",
  },
  {
    question: "What happens to my files if I cancel?",
    answer: "Paid access continues through the billing period you already paid for. When access ends, public portfolios and sharing links are disabled, and your files are kept privately for 30 days so you can reactivate, export, or request deletion. After that window, the files are queued for deletion.",
  },
  {
    question: "Who handles payments?",
    answer: "Stripe securely handles payment methods, subscriptions, and billing. PhotoView does not store your raw credit card number.",
  },
  {
    question: "How does PhotoView handle my photographs?",
    answer: "You keep ownership of everything you upload. PhotoView stores and prepares display copies only to operate your portfolio, website, embeds, and sharing tools. You control which work is public, private, password protected, or hidden.",
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes. Start with a PhotoView address, then connect a domain you already own. Guided setup covers both the root domain and www address.",
  },
  {
    question: "Can I build more than one website?",
    answer: "Yes. Create unlimited drafts using the portfolios and catalog in your account. Your first live website is included; each additional activated website costs $1.29 per month and can use its own PhotoView.io address or custom domain.",
  },
  {
    question: "Can I add PhotoView to my current website?",
    answer: "Yes. Create separate embed profiles for one portfolio or your complete portfolio grid. When you update PhotoView, connected embeds update too.",
  },
  {
    question: "Will my photographs look good on a phone?",
    answer: "Yes. The mobile viewer is full-screen, swipeable, and designed specifically for vertical and landscape images rather than merely shrinking a desktop page.",
  },
  {
    question: "Can I keep a portfolio private?",
    answer: "Yes. Use private links, passwords, email verification, download controls, and watermarks according to the audience and purpose.",
  },
  {
    question: "Can I import directly from Lightroom Classic?",
    answer: "Yes. The Lightroom Plugin sends finished rendered files up to 50 MB into a new or existing PhotoView portfolio.",
  },
  {
    question: "Does PhotoView support video?",
    answer: "Yes. Photographs, MP4 files, and MOV files can live together in a portfolio, and the website Hero can use an uploaded looping MP4.",
  },
  {
    question: "What happens if I change templates?",
    answer: "Your portfolios, pages, and content stay in place. You can switch templates and then refine the controls that are relevant to the new design.",
  },
] as const

export function marketingFaqStructuredData(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: marketingFaqs.map(({ answer, question }) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: answer },
      name: question,
    })),
    url,
  }
}
