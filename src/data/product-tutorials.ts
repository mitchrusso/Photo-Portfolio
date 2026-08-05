export type ProductTutorial = {
  slug: string
  order: number
  title: string
  summary: string
  outcome: string
  readTime: string
  category: "Build your website"
  beforeYouStart: string[]
  checklist: string[]
  screenshot: {
    src: string
    alt: string
    caption: string
  }
  steps: {
    heading: string
    body: string[]
    tip?: string
  }[]
}

export const productTutorials: ProductTutorial[] = [
  {
    slug: "my-website-beginners-tour",
    order: 1,
    title: "My Website: A Complete Beginner’s Tour",
    summary: "Learn where the main website controls live and how the editor, Live Canvas, preview, and publishing tools work together.",
    outcome: "You will know how to move around My Website, make a safe draft change, preview it, and save it.",
    readTime: "7 min",
    category: "Build your website",
    beforeYouStart: [
      "Sign in on a desktop or laptop for the most comfortable editing workspace.",
      "Choose one small change to practice with. Nothing becomes public until you publish.",
    ],
    checklist: [
      "You can open and close cards in the left editing panel.",
      "You know the difference between Live Canvas, Preview, Save, and Publish.",
      "You checked the draft at desktop and mobile canvas sizes.",
      "The unsaved-changes warning cleared after you saved.",
    ],
    screenshot: {
      src: "/tutorials/website-builder-overview.png",
      alt: "PhotoView My Website editor with page controls on the left and the Live Canvas on the right",
      caption: "The left panel contains the settings for the selected page. The Live Canvas on the right shows the effect of your changes before publishing.",
    },
    steps: [
      {
        heading: "Open My Website",
        body: [
          "Sign in to PhotoView and select My Website from the dashboard. The editor opens on the Home page.",
          "The page selector in the top toolbar lets you move among Home, About, Contact, and the other pages you have enabled.",
        ],
      },
      {
        heading: "Understand the two working areas",
        body: [
          "Use the left panel to edit identity, template styling, page blocks, text, images, and visibility. Use the Live Canvas to see the result.",
          "Open a card in the left panel to reveal its controls. The eye button shows or hides a block. The dotted handle lets you drag movable Home-page blocks into a new order.",
        ],
      },
      {
        heading: "Use the top toolbar",
        body: [
          "Switch between desktop and mobile canvas sizes to check responsive behavior. Edit Hints explains the controls on the current page, Ask AI How To answers a specific PhotoView question, and Tours walks you through a complete task.",
          "Every top control also has a short hover label, even when Edit Hints is off. The selection-arrow control lets you select editable canvas sections directly; turn it off when you only want to interact with the preview.",
          "The status near Save tells you whether you are editing an unpublished draft.",
        ],
      },
      {
        heading: "Make and save one draft change",
        body: [
          "Open a text field, make a small change, and check the Live Canvas. Select Save when the result is correct.",
          "Saving preserves the draft. It does not make the change public.",
        ],
        tip: "Work in small groups of changes and save after each group. It is much easier to spot which setting caused an unexpected result.",
      },
      {
        heading: "Preview before publishing",
        body: [
          "Select Preview in the Live Canvas header to inspect the website without the editing controls.",
          "Publishing is a separate action. Nothing in this beginner exercise needs to go live until you are ready.",
        ],
      },
    ],
  },
  {
    slug: "choose-website-template",
    order: 2,
    title: "Choose the Right Website Template",
    summary: "Compare PhotoView templates by presentation style, image shape, navigation, and the kind of story you want the site to tell.",
    outcome: "You will select a template that suits your photographs and understand what changes when a new template is applied.",
    readTime: "8 min",
    category: "Build your website",
    beforeYouStart: [
      "Prepare at least one portfolio containing portrait, landscape, panoramic, and square photographs when possible.",
      "Decide whether visitors should experience one image at a time, scan a collection, or move through a story.",
    ],
    checklist: [
      "The template supports the natural shapes of your photographs without unwanted cropping.",
      "Long names, headings, and navigation labels remain readable.",
      "Template-specific controls such as headline size, color, font, speed, and position behave as expected.",
      "The complete template works on both desktop and mobile.",
    ],
    screenshot: {
      src: "/tutorials/choose-template.png",
      alt: "PhotoView website builder displaying the Coral Panorama photography template",
      caption: "Templates change the presentation system—such as the panoramic contact sheet shown here—while continuing to use your own identity, photographs, portfolios, and captions.",
    },
    steps: [
      {
        heading: "Decide how visitors should experience the work",
        body: [
          "Choose a quiet editorial template when captions and projects should lead. Choose a cinematic template when one photograph at a time should dominate. Choose a masonry or panorama template when visitors should scan many differently shaped photographs.",
          "Do not choose only by color. Colors, type, spacing, and image treatments can be adjusted after the overall presentation is right.",
        ],
      },
      {
        heading: "Open the template chooser",
        body: [
          "In My Website, open Home and find Template controls. Open the template chooser and review the miniature previews.",
          "Select a template to apply its recommended starting layout to the draft.",
        ],
      },
      {
        heading: "Test with your real photographs",
        body: [
          "Look at portrait, landscape, square, and panoramic images in the Live Canvas. A template that looks striking with one photograph may not suit the range of your portfolio.",
          "Try the navigation and any template-specific grid, viewer, film-strip, contact-sheet, split-screen, or scrolling-headline controls. PhotoView shows headline size, color, font, speed, slowdown, alignment, and vertical-position controls only on templates that use them.",
          "Outside explicit thumbnail treatments, templates should preserve the complete photograph. If a display crops important content or adds an unexplained gray panel, change the image-fit control or choose a more appropriate template.",
        ],
      },
      {
        heading: "Check desktop and mobile",
        body: [
          "Use both canvas buttons in the toolbar. Pay special attention to long photographer names, menu labels, captions, and portrait-oriented photographs.",
          "If the structure works in both sizes, refine it with Template controls instead of changing templates repeatedly.",
        ],
      },
      {
        heading: "Save the selected template",
        body: [
          "Select Save to keep the template in your website draft. Then open Preview and review the complete page from top to bottom.",
        ],
        tip: "Your photographs remain yours when templates change. The template controls their presentation, not the underlying portfolio files.",
      },
    ],
  },
  {
    slug: "website-name-logo-brand-identity",
    order: 3,
    title: "Set Your Website Name, Logo, and Brand Identity",
    summary: "Create a clear public identity using your photographer name, optional logo, colors, typography, and navigation labels.",
    outcome: "You will create a consistent website header that identifies you without competing with your photographs.",
    readTime: "7 min",
    category: "Build your website",
    beforeYouStart: [
      "Choose the exact public name visitors should remember.",
      "If you will use a logo, prepare a clean transparent PNG and keep a text-only fallback in mind.",
    ],
    checklist: [
      "Your name or logo is readable against every header treatment.",
      "Typography and colors are consistent across more than one page.",
      "Navigation labels are short and understandable on a phone.",
      "The identity supports the photography instead of overpowering it.",
    ],
    screenshot: {
      src: "/tutorials/website-identity.png",
      alt: "PhotoView website editor showing a photography site identity above a large hero image",
      caption: "Website identity appears at the top of the Live Canvas. Keep the name readable and use the template controls to support—not overpower—the photography.",
    },
    steps: [
      {
        heading: "Open Website identity",
        body: [
          "Open My Website, choose Home, and expand Website identity in the left panel.",
          "Enter the public photographer or studio name exactly as you want visitors to see it.",
        ],
      },
      {
        heading: "Add an optional logo",
        body: [
          "Upload a clean logo with enough contrast for the chosen header. A transparent PNG works well for most marks.",
          "Preview the result at desktop and mobile sizes. If the logo becomes unreadable when small, use the text identity instead.",
        ],
      },
      {
        heading: "Choose supporting typography and colors",
        body: [
          "Open Template controls to choose the type and color treatment. Use one strong display choice and a highly readable body treatment.",
          "Choose a solid background or upload background images to the reusable background library. Switching to a color does not delete the saved images, so you can return to them later without uploading again.",
          "Check text over photographs as well as text on the page background.",
        ],
      },
      {
        heading: "Keep navigation labels short",
        body: [
          "Use familiar labels such as Home, About, Portfolios, Stories, and Contact. Short labels fit more reliably on phones.",
          "Your identity and navigation should make the site understandable within a few seconds.",
        ],
      },
      {
        heading: "Save and review the complete header",
        body: [
          "Save the draft, open Preview, and visit more than one page. Confirm that the name, logo, navigation, and colors remain consistent.",
        ],
      },
    ],
  },
  {
    slug: "build-photography-homepage",
    order: 4,
    title: "Build an Effective Photography Homepage",
    summary: "Arrange Hero, Featured Work, portfolios, film strips, and text sections into a focused introduction to your photography.",
    outcome: "You will create a homepage with a clear opening, a strong edit, and an intentional path into the rest of your work.",
    readTime: "9 min",
    category: "Build your website",
    beforeYouStart: [
      "Choose the three most important things a first-time visitor should see or do.",
      "Finish the portfolio covers and titles you expect to feature.",
    ],
    checklist: [
      "The first screen clearly identifies you and the kind of work you make.",
      "Featured Work and All Portfolios do not repeat the same visual job unnecessarily.",
      "Text, portfolio grids, film strips, and Accordion Story chapters appear in a deliberate order.",
      "Hidden or unfinished sections do not appear in Preview.",
      "A visitor has an obvious next step into a portfolio, story, About page, or Contact page.",
    ],
    screenshot: {
      src: "/tutorials/build-homepage.png",
      alt: "Comparison showing custom homepage sections and the resulting PhotoView photography site",
      caption: "Home-page blocks let you create a deliberate sequence instead of placing every portfolio in one uninterrupted wall.",
    },
    steps: [
      {
        heading: "Choose one job for the homepage",
        body: [
          "Decide whether the homepage should introduce your range, lead with one current story, or direct visitors to a few specialties.",
          "A homepage is an edit, not an inventory. Keep the strongest destinations visible and let deeper pages hold the complete work.",
        ],
      },
      {
        heading: "Start with the Hero",
        body: [
          "Use one photograph, one video, or a rotating portfolio. Choose Fill frame for an immersive crop or Show full image when the entire composition must remain visible.",
          "Use a short headline and optional story label only when they add context.",
        ],
      },
      {
        heading: "Add Featured Work",
        body: [
          "Select a focused portfolio or curated group for Featured Work. Pick the display style that respects the photographs: slideshow, thumbnails, film strip, cover cards, or full-frame grid.",
        ],
      },
      {
        heading: "Create visual chapters",
        body: [
          "Use Text blocks to introduce subjects such as Portraits, Landscape, Travel, or Products. Follow each label with a Portfolio grid containing only the relevant destinations.",
          "A Film Strip can create a compact visual transition under the Hero or between larger sections.",
          "Use Accordion Story when you want two to six expandable chapters. Rename starter tabs such as Origin, write the story for each chapter, and optionally select a portfolio whose cover supplies the chapter image. Desktop uses vertical chapter tabs; mobile becomes a stacked accordion.",
        ],
      },
      {
        heading: "Reorder, hide, and review",
        body: [
          "Drag blocks into the intended reading order and use the eye controls to hide anything that is not ready.",
          "Review the full page in Preview. Remove repeated ideas and make sure the most important work appears before a visitor needs to scroll far.",
        ],
      },
    ],
  },
  {
    slug: "create-perfect-hero-section",
    order: 5,
    title: "Create the Perfect Hero Section",
    summary: "Control the Hero photograph, framing, heading, story label, text alignment, and background treatment.",
    outcome: "You will create a strong first screen without accidental cropping, black letterboxing, or unwanted overlay text.",
    readTime: "8 min",
    category: "Build your website",
    beforeYouStart: [
      "Choose a Hero source with enough resolution for a large display.",
      "Identify any part of the composition—such as a face, horizon, or architectural edge—that must never be cropped.",
    ],
    checklist: [
      "The important part of the image remains visible on desktop and mobile.",
      "Optional story-label text appears only when you intentionally enable it.",
      "Headline size, alignment, vertical position, color, and font remain readable.",
      "Any image frame is intentional; choose None when you do not want a thin, gold, shadow, or print treatment.",
      "Full-image space reveals the selected website background instead of an accidental gray or black box.",
    ],
    screenshot: {
      src: "/tutorials/hero-controls.png",
      alt: "PhotoView Hero settings with the Show story label switch and the resulting hero image",
      caption: "Use the explicit Show story label switch when you do not want the small label. You do not need to erase the field or enter a blank space.",
    },
    steps: [
      {
        heading: "Open the Hero block",
        body: [
          "In My Website, open Home and expand Hero. Select the image, video, or portfolio source you want visitors to see first.",
        ],
      },
      {
        heading: "Choose how the image fits",
        body: [
          "Choose Fill frame when edge-to-edge impact matters and some cropping is acceptable. Choose Show full image when the entire composition must remain visible.",
          "When Show full image leaves space around the photograph, PhotoView uses the current website background color or background image instead of black.",
        ],
      },
      {
        heading: "Set the heading and supporting text",
        body: [
          "Edit the website-only Hero heading in the Hero controls. This text is independent from the portfolio title.",
          "Keep overlay copy short, choose its alignment, and check that it remains readable over both bright and dark areas.",
          "Templates with a moving headline add controls for size, color, font, scroll speed, center slowdown, and vertical position. Use one circulating copy of the headline; PhotoView repeats it only as needed to keep the motion continuous without leaving an empty screen.",
        ],
      },
      {
        heading: "Show or hide the story label",
        body: [
          "Use Show story label to control the small label above the headline. Turn it off when the photograph and main heading need a quieter presentation.",
          "Use Image frame in Template controls to choose None, Thin, Gold, Shadow, or Print. Frame thickness applies only when the selected frame supports it; choose None to remove an unwanted gold or decorative box.",
        ],
      },
      {
        heading: "Check several screens",
        body: [
          "Preview desktop and mobile. Look for cropped faces, cut-off architecture, text near the image edge, and low contrast.",
          "Save once the Hero works at both sizes.",
        ],
        tip: "If one source photograph cannot work at both wide and narrow sizes, Show full image is usually safer than forcing a severe Fill frame crop.",
      },
    ],
  },
  {
    slug: "display-best-work-homepage",
    order: 6,
    title: "Display Your Best Work on the Homepage",
    summary: "Choose the right portfolio source, image order, covers, and display style for the Featured Work section.",
    outcome: "You will present a concise selection in an arrangement that respects each photograph’s natural shape.",
    readTime: "8 min",
    category: "Build your website",
    beforeYouStart: [
      "Complete the source portfolio’s image order, visibility, title, and cover.",
      "Decide whether the section should display photographs directly or act as a set of portfolio destinations.",
    ],
    checklist: [
      "Only finished, visible photographs appear.",
      "The opening images are strong and near-duplicates are separated or removed.",
      "Full-frame presentations preserve natural image proportions; only thumbnail treatments crop.",
      "Captions and portfolio titles come from subscriber content rather than unexplained starter labels.",
      "Controls, links, and horizontal movement remain understandable on mobile.",
    ],
    screenshot: {
      src: "/tutorials/featured-work.png",
      alt: "PhotoView Featured Work controls with Full-frame grid selected and mixed-orientation photographs in the Live Canvas",
      caption: "Full-frame grid keeps portrait, landscape, square, and panoramic photographs in their natural proportions instead of forcing uniform crops.",
    },
    steps: [
      {
        heading: "Prepare the source portfolio",
        body: [
          "Choose a portfolio with a deliberate sequence and no unfinished work. Set strong titles, captions, and a cover where the selected presentation uses them.",
        ],
      },
      {
        heading: "Open Featured Work",
        body: [
          "In Home page blocks, expand Featured Work and select the portfolio or selection to feature.",
          "Showing or hiding Featured Work does not change the separate All portfolios block.",
        ],
      },
      {
        heading: "Choose a presentation",
        body: [
          "Use a slideshow for a slow, focused sequence; thumbnail grid for quick scanning; film strip for a compact horizontal edit; cover cards for portfolio destinations; or Full-frame grid for mixed orientations without cropping.",
        ],
      },
      {
        heading: "Edit for pace",
        body: [
          "Begin with one of the strongest photographs, vary distance and orientation, and avoid several near-duplicates in a row.",
          "A shorter selection usually creates a stronger first impression than showing every good photograph.",
        ],
      },
      {
        heading: "Test interaction and save",
        body: [
          "Click through the presentation in Live Canvas and Preview. Check hover text, captions, lightbox behavior, and mobile spacing before saving.",
        ],
      },
    ],
  },
  {
    slug: "organize-homepage-custom-sections",
    order: 7,
    title: "Organize Your Homepage with Custom Sections",
    summary: "Use Text blocks and Portfolio grids to separate your work into subjects, specialties, stories, or services.",
    outcome: "You will break a long homepage into clear, movable sections that visitors can understand quickly.",
    readTime: "7 min",
    category: "Build your website",
    beforeYouStart: [
      "Write a short list of the specialties, services, or stories that visitors actually need.",
      "Choose whether each idea needs a heading, a group of portfolio destinations, or an expandable Accordion Story chapter.",
    ],
    checklist: [
      "Each section has one clear purpose and a visitor-friendly heading.",
      "Portfolio grids contain only the destinations relevant to their chapter.",
      "Accordion Story tabs use meaningful names instead of untouched starter text such as Origin.",
      "The reading order works from top to bottom without repeated introductions.",
      "Sections you may use later are hidden rather than published unfinished.",
    ],
    screenshot: {
      src: "/tutorials/custom-sections.png",
      alt: "PhotoView custom Text block controls with title, body, alignment, visibility, and move controls",
      caption: "Every custom block can be edited, shown or hidden, moved in the Home-page sequence, or removed. PhotoView supports up to 12 custom Home blocks.",
    },
    steps: [
      {
        heading: "Plan the sections",
        body: [
          "List the two to five categories that matter most to visitors, such as Portraits, Landscapes, Travel, Products, or Recent Stories.",
          "Use the language a prospective visitor would recognize, not internal folder names.",
        ],
      },
      {
        heading: "Add a Text block",
        body: [
          "Under Home page blocks, select Text block. Add a short title and optional introduction, then choose the alignment.",
          "Use the text as a chapter heading rather than a long essay.",
        ],
      },
      {
        heading: "Add a Portfolio grid",
        body: [
          "Select Portfolio grid and choose only the portfolios that belong under that chapter.",
          "Repeat the Text block and Portfolio grid pattern for other specialties when it improves clarity.",
        ],
      },
      {
        heading: "Add an Accordion Story when the visitor should reveal chapters",
        body: [
          "Open Accordion Story in the left menu and turn on Show on website. Replace My story with the complete section heading, then rename every starter tab so it describes the real chapter.",
          "Use each Story field for the text revealed by that tab. You can arrange two to six chapters, reorder them, and optionally choose a portfolio cover as the chapter image. Choose No image for a text-only chapter.",
          "Check the wide vertical tabs in Desktop Preview and the stacked accordion in Mobile Preview before publishing.",
        ],
      },
      {
        heading: "Move and hide blocks",
        body: [
          "Drag blocks with the dotted handle or use the move controls inside the open card. Use the eye control to hide a section without deleting its setup.",
        ],
      },
      {
        heading: "Keep the page edited",
        body: [
          "PhotoView supports up to 12 custom Home blocks, but a good homepage rarely needs the maximum. Preview the whole page and remove sections that repeat the same work.",
        ],
      },
    ],
  },
  {
    slug: "build-professional-about-page",
    order: 8,
    title: "Build a Professional About Page",
    summary: "Write a concise photographer biography, choose a useful portrait, and give visitors a natural next step.",
    outcome: "You will publish an About page that explains who you are, what you photograph, and why a visitor should continue.",
    readTime: "8 min",
    category: "Build your website",
    beforeYouStart: [
      "Write down what you photograph, whom you serve, where you work, and the one fact that makes your perspective distinctive.",
      "Prepare a current portrait, working photograph, or a short introduction video if you want media on the page.",
    ],
    checklist: [
      "The first paragraph quickly explains who you are and what you photograph.",
      "The biography is broken into readable paragraphs instead of one long block.",
      "Photo or video media displays correctly, with the still image acting as the video poster and fallback when both are saved.",
      "The About button has the intended label and destination.",
      "Contact or the most relevant portfolio is easy to reach next.",
    ],
    screenshot: {
      src: "/tutorials/about-page.png",
      alt: "PhotoView published photography site showing About and Contact content",
      caption: "A useful About page combines a recognizable photograph or short introduction video, a focused biography, and an obvious route to Contact or the relevant portfolio.",
    },
    steps: [
      {
        heading: "Open the About page",
        body: [
          "Use the page selector in My Website and choose About me. Turn the page on if it is currently hidden from your website.",
        ],
      },
      {
        heading: "Write for a first-time visitor",
        body: [
          "Begin with what you photograph and where or for whom you work. Add the experience, point of view, or motivation that helps someone understand the work.",
          "Use short paragraphs and remove details that do not help a visitor decide to explore or contact you.",
        ],
      },
      {
        heading: "Choose a portrait, working image, or short video",
        body: [
          "Use a current photograph that feels consistent with your public identity, or upload a short MP4 or MOV introduction video. A portrait, studio view, photograph of you working, or concise on-camera welcome can all be appropriate.",
          "About videos can be up to 200 MB and 90 seconds. They stay paused in the editor and use visitor playback controls in Preview and on the published website.",
          "If you keep both a photo and a video, the video is displayed while the photo acts as its poster and fallback. Remove the video whenever you want to return to the still photograph.",
        ],
      },
      {
        heading: "Add proof selectively",
        body: [
          "Include meaningful exhibitions, clients, publications, awards, or locations when they establish relevant credibility. Avoid turning the page into an unedited résumé.",
        ],
      },
      {
        heading: "Provide a next step",
        body: [
          "The About button defaults to Get in touch and opens Contact. Change its label and destination when it should open a portfolio, booking page, another PhotoView page, or a secure external address.",
          "The button is intentionally inactive in the editable Live Canvas. Test it in Preview and on the published website.",
          "Make Contact available in the navigation when an inquiry is the desired outcome. If the biography mentions a specialty, make the corresponding portfolio easy to find.",
        ],
      },
    ],
  },
  {
    slug: "check-desktop-mobile",
    order: 9,
    title: "Check Your Website on Desktop and Mobile",
    summary: "Use the responsive canvas to catch image crops, long headings, menu issues, and spacing problems before visitors see them.",
    outcome: "You will complete a repeatable desktop-and-mobile quality check of every important page.",
    readTime: "6 min",
    category: "Build your website",
    beforeYouStart: [
      "Save the current draft so the review starts from a known state.",
      "Make a short list of every visible page, portfolio destination, button, and special interaction you need to test.",
    ],
    checklist: [
      "Navigation, logo, headings, and buttons remain readable and tappable.",
      "Faces, horizons, panoramas, and architecture are not damaged by unintended crops.",
      "Scrolling headlines, film strips, slideshows, Accordion Story chapters, and viewers work at both sizes.",
      "No Save control or floating tool covers a setting or selection.",
      "Every visible page has been checked—not only the top of Home.",
    ],
    screenshot: {
      src: "/tutorials/mobile-preview.png",
      alt: "PhotoView website builder showing the Coral Panorama template in the mobile Live Canvas",
      caption: "The mobile canvas is not just a smaller desktop view. Use it to inspect the mobile identity, navigation, image framing, viewers, and horizontal interactions.",
    },
    steps: [
      {
        heading: "Start with desktop",
        body: [
          "Select the desktop canvas button and review the header, Hero, every Home block, footer, and primary pages.",
          "Click menus, portfolio covers, viewers, previous and next controls, and any film strip or contact sheet.",
        ],
      },
      {
        heading: "Switch to mobile",
        body: [
          "Select the phone canvas button. Review the same journey instead of checking only the top of the Home page.",
          "Watch for names that wrap badly, labels that collide, buttons that feel too small, and text that sits too close to the edge.",
        ],
      },
      {
        heading: "Inspect photograph framing",
        body: [
          "Check faces, horizons, architecture, and panoramas. If Fill frame removes essential content, use Show full image or choose a more flexible source image.",
        ],
      },
      {
        heading: "Check reading and interaction",
        body: [
          "Confirm that body text is readable, captions are not clipped, overlays have enough contrast, and horizontally scrolling presentations provide an obvious way to move.",
          "Open Accordion Story chapters, run slideshows, move through split-screen arrows, and watch at least one complete scrolling-headline cycle. A layout can fit correctly while its interaction still feels too fast, too high, or unclear.",
        ],
      },
      {
        heading: "Repeat after major changes",
        body: [
          "Run this check whenever you change the template, identity, Hero, navigation, or page order. Save only after both canvas sizes are satisfactory.",
        ],
      },
    ],
  },
  {
    slug: "preview-publish-update-website",
    order: 10,
    title: "Preview, Publish, and Update Your Website",
    summary: "Understand the difference between editing, saving a draft, previewing, publishing, and checking the public website.",
    outcome: "You will publish deliberately and verify that the public site matches the draft you approved.",
    readTime: "7 min",
    category: "Build your website",
    beforeYouStart: [
      "Finish the content, responsive review, and Contact delivery address for every page you intend to publish.",
      "If using a purchased domain, have access to its DNS provider even when the registrar is a different company.",
    ],
    checklist: [
      "The saved draft and Preview match the version you intend to publish.",
      "The PhotoView.io address opens successfully.",
      "For a purchased domain, ownership and DNS checks both pass.",
      "The preferred root or www address opens and the alternate address permanently redirects to it.",
      "The public website, portfolio links, navigation, and Contact workflow work as a visitor would experience them.",
    ],
    screenshot: {
      src: "/tutorials/preview-publish.png",
      alt: "PhotoView guided publishing screen for a subscriber website",
      caption: "Save preserves your draft; Preview lets you inspect it; Publish website sends the approved version to the public address.",
    },
    steps: [
      {
        heading: "Save the draft",
        body: [
          "Select Save after editing. Wait for the unsaved-change warning to clear before leaving My Website.",
          "A saved draft is not automatically public.",
        ],
      },
      {
        heading: "Open Preview",
        body: [
          "Select Preview in the Live Canvas header. Review the Home page and follow the real navigation to every page affected by the change.",
          "Return to the builder to correct anything that looks wrong.",
        ],
      },
      {
        heading: "Confirm the public address",
        body: [
          "Use Address to review the PhotoView website address or connect one purchased custom domain. Enter the preferred domain, such as example.com or www.example.com. PhotoView also connects the matching root or www address and redirects it to your preferred address.",
          "PhotoView detects many DNS providers. If Set up automatically appears, select it, review and approve the proposed records on the provider's website, then return to PhotoView. PhotoView never asks for the provider password or changes DNS without that approval.",
          "If automatic setup does not appear, open the detected provider and add the displayed A, CNAME, or TXT records exactly as shown. Use the Copy buttons, remove only conflicting records for the same host, and leave unrelated email, MX, SPF, DKIM, and verification records intact.",
          "Return to Address and select Check connection until Ownership verified and DNS points to PhotoView both pass. A pending result can simply mean DNS is still propagating. The PhotoView.io address remains available throughout setup.",
        ],
      },
      {
        heading: "Publish the approved version",
        body: [
          "Select Publish website only after Preview is correct. Confirm the action when prompted.",
          "Publishing updates the public website with the saved version; it does not publish unsaved changes.",
        ],
      },
      {
        heading: "Verify as a visitor",
        body: [
          "Open the public address in a fresh browser tab. Check the changed page on desktop and phone, open at least one portfolio, and test Contact when it was affected.",
          "For future updates, repeat Save, Preview, Publish, and public verification in that order.",
        ],
        tip: "Treat public verification as part of publishing, not as an optional final glance.",
      },
    ],
  },
]

export function getProductTutorial(slug: string) {
  return productTutorials.find((tutorial) => tutorial.slug === slug)
}
