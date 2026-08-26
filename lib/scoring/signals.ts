/**
 * Digital Signal Extractor
 *
 * Analyzes a business's website content (markdown from Firecrawl) to detect
 * digital maturity signals used by the scoring algorithm.
 *
 * Signals detected:
 * - has_chat:        Does the site have live chat widget?
 * - has_whatsapp:    Is there a WhatsApp link or button?
 * - has_booking:     Is there online booking/scheduling?
 * - has_contact_form: Is there a contact form?
 * - has_blog:        Is there a blog?
 * - has_testimonials: Customer testimonials/reviews on site?
 * - mentions_24_7:   Does the site mention 24/7 availability?
 * - has_phone:       Is phone number visible?
 * - has_email:       Is email visible?
 * - has_address:     Is physical address visible?
 * - has_social:      Are social media links present?
 * - mobile_friendly: Has viewport meta tag? (caller provides)
 * - last_post_age_days: Age of last blog/news post (0 = current)
 * - design_year:     Approximate year of design (heuristic)
 */

export interface DigitalSignals {
  has_chat: boolean;
  has_whatsapp: boolean;
  has_booking: boolean;
  has_contact_form: boolean;
  has_blog: boolean;
  has_testimonials: boolean;
  mentions_24_7: boolean;
  has_phone: boolean;
  has_email: boolean;
  has_address: boolean;
  has_social: boolean;
  has_viewport_meta: boolean;
  has_https: boolean;
  has_structured_data: boolean; // Schema.org JSON-LD
  is_parked_or_broken: boolean; // Domain parking / GoDaddy lander / 404
  domain_status: "active" | "parked" | "offline" | "no_website";
  cms_name: "WordPress" | "Wix" | "Squarespace" | "Shopify" | "Webflow" | "GoDaddy" | "Weebly" | "Custom" | "None" | null;
  detected_tech: string[];
  last_post_age_days: number | null; // null = no posts or unknown
  word_count: number;
  raw_content_length: number;

  // ── Nuevas señales avanzadas (8% Restante) ──
  has_active_ads: boolean;
  detected_ad_pixels: string[];
  location_count: number;
  has_multiple_locations: boolean;
  location_hints: string[];
  social_profiles: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    yelp?: string | null;
    linkedin?: string | null;
  };
  has_social_presence: boolean;
  social_funnel_gap: boolean;
}

export type ReviewComplaintType =
  | "missed_calls"
  | "slow_response"
  | "booking_difficulty"
  | "pricing_dispute";

export interface ReviewAnalysis {
  complaints: ReviewComplaintType[];
  hasMissedCalls: boolean;
  hasSlowResponse: boolean;
  hasBookingIssues: boolean;
  evidenceSnippets: string[];
}

export function analyzeReviewSentiments(reviewsText: string[] | string): ReviewAnalysis {
  const combined = Array.isArray(reviewsText) ? reviewsText.join(" ") : (reviewsText ?? "");
  const lower = combined.toLowerCase();

  const MISSED_CALL_PATTERNS = [
    "never answered", "didn't answer", "did not answer", "no answer", "called multiple times",
    "called 3 times", "called 4 times", "called several times", "nobody answers", "no one answers",
    "never picked up", "didn't pick up", "hard to reach", "straight to voicemail", "no contestan",
    "no responde", "nunca contestan", "no atienden"
  ];

  const SLOW_RESPONSE_PATTERNS = [
    "took days", "slow response", "waited 2 days", "waited 3 days", "waiting for quote",
    "never sent estimate", "never called back", "didn't call back", "no follow up",
    "slow to reply", "demoraron", "tardaron mucho", "no devolvieron la llamada"
  ];

  const BOOKING_PATTERNS = [
    "hard to schedule", "hard to book", "couldn't get an appointment", "scheduling nightmare",
    "canceled appointment", "never showed up", "difícil agendar", "cancelaron la cita"
  ];

  const complaints: ReviewComplaintType[] = [];
  const evidenceSnippets: string[] = [];

  if (MISSED_CALL_PATTERNS.some((p) => lower.includes(p))) {
    complaints.push("missed_calls");
    evidenceSnippets.push("Clientes reportan llamadas no contestadas o buzón lleno");
  }

  if (SLOW_RESPONSE_PATTERNS.some((p) => lower.includes(p))) {
    complaints.push("slow_response");
    evidenceSnippets.push("Demoras en envío de cotizaciones o seguimiento");
  }

  if (BOOKING_PATTERNS.some((p) => lower.includes(p))) {
    complaints.push("booking_difficulty");
    evidenceSnippets.push("Dificultad para coordinar o agendar citas");
  }

  return {
    complaints,
    hasMissedCalls: complaints.includes("missed_calls"),
    hasSlowResponse: complaints.includes("slow_response"),
    hasBookingIssues: complaints.includes("booking_difficulty"),
    evidenceSnippets,
  };
}

const CHAT_KEYWORDS = [
  "intercom",
  "drift",
  "tawk.to",
  "tidio",
  "livechat",
  "live chat",
  "chat with us",
  "chat now",
  "hablar con",
  "chatea con",
  "chat en vivo",
];

const WHATSAPP_KEYWORDS = [
  "wa.me/",
  "whatsapp://",
  "api.whatsapp.com",
  "send?phone=",
  "whatsapp business",
  "enviar whatsapp",
  "escríbenos por whatsapp",
];

const BOOKING_KEYWORDS = [
  "book now",
  "schedule appointment",
  "book online",
  "agendar cita",
  "reservar",
  "make an appointment",
  "schedule a service",
  "calendly.com",
  "acuityscheduling",
  "setmore",
  "squareup.com/appointments",
  "booksy",
];

const TWENTY_FOUR_SEVEN = [
  "24/7",
  "24 hours",
  "24 horas",
  "around the clock",
  "anytime",
  "always available",
  "emergency service",
  "servicio de emergencia",
  "available 24",
];

const BLOG_KEYWORDS = [
  "/blog",
  "/news",
  "/articulos",
  "/consejos",
  "blog post",
  "recent posts",
  "latest articles",
];

const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "yelp.com",
];

export function extractDigitalSignals(
  content: { markdown: string; html: string; metadata?: Record<string, any> },
  websiteUrl: string
): DigitalSignals {
  const md = (content.markdown ?? "").toLowerCase();
  const html = (content.html ?? "").toLowerCase();
  const fullText = md + " " + html;
  const meta = content.metadata ?? {};

  const countOccurrences = (keyword: string) =>
    (fullText.match(new RegExp(escapeRegex(keyword), "g")) ?? []).length;

  const anyMatch = (keywords: string[]) =>
    keywords.some((k) => fullText.includes(k.toLowerCase()));

  // Word count (rough)
  const wordCount = md.split(/\s+/).filter(Boolean).length;

  // Detect parked, expired or broken domain landing pages
  const isParkedOrBroken =
    fullText.includes("window.lander_system") ||
    fullText.includes('ap:"parking"') ||
    fullText.includes('window.location.href="/lander"') ||
    fullText.includes("location.href='/lander'") ||
    fullText.includes("location.href=\"/lander\"") ||
    fullText.includes("domain for sale") ||
    fullText.includes("buy this domain") ||
    fullText.includes("sedoparking") ||
    fullText.includes("godaddy.com/park") ||
    fullText.includes("this domain is parked") ||
    fullText.includes("namecheap.com/domains/parked") ||
    (wordCount < 25 && (fullText.includes("lander") || fullText.includes("location.href")));

  const domainStatus = isParkedOrBroken ? "parked" : "active";

  // Detect CMS / Website Builder Platform
  let cmsName: DigitalSignals["cms_name"] = null;
  const detectedTech: string[] = [];

  if (isParkedOrBroken) {
    cmsName = "None";
    detectedTech.push("Dominio Vencido / Parking");
  } else if (fullText.includes("wp-content") || fullText.includes("wp-includes") || fullText.includes("wordpress")) {
    cmsName = "WordPress";
    detectedTech.push("WordPress");
    if (fullText.includes("elementor")) detectedTech.push("Elementor");
    if (fullText.includes("woocommerce")) detectedTech.push("WooCommerce");
    if (fullText.includes("divi")) detectedTech.push("Divi");
  } else if (fullText.includes("wix.com") || fullText.includes("_wix") || fullText.includes("wixstatic")) {
    cmsName = "Wix";
    detectedTech.push("Wix");
  } else if (fullText.includes("squarespace") || fullText.includes("static1.squarespace")) {
    cmsName = "Squarespace";
    detectedTech.push("Squarespace");
  } else if (fullText.includes("cdn.shopify.com") || fullText.includes("shopify")) {
    cmsName = "Shopify";
    detectedTech.push("Shopify");
  } else if (fullText.includes("assets.website-files.com") || fullText.includes("webflow")) {
    cmsName = "Webflow";
    detectedTech.push("Webflow");
  } else if (fullText.includes("secureserver.net") || fullText.includes("godaddy.com/websites")) {
    cmsName = "GoDaddy";
    detectedTech.push("GoDaddy Website Builder");
  } else if (fullText.includes("weebly.com") || fullText.includes("editmysite.com")) {
    cmsName = "Weebly";
    detectedTech.push("Weebly");
  } else if (fullText.includes("_next") || fullText.includes("react") || fullText.includes("tailwind")) {
    cmsName = "Custom";
    detectedTech.push("Web Moderna (React / Next.js / Tailwind)");
  }

  // ── 1. Detección de Píxeles de Anuncios Activos (Meta / Google / TikTok) ──
  const detectedAdPixels: string[] = [];
  if (
    fullText.includes("fbevents.js") ||
    fullText.includes("fbq(") ||
    fullText.includes("connect.facebook.net") ||
    fullText.includes("facebook-jssdk")
  ) {
    detectedAdPixels.push("Meta (Facebook) Pixel");
  }

  if (
    fullText.includes("googleadservices.com") ||
    fullText.includes("google_conversion_id") ||
    fullText.includes("gtag('config', 'aw-") ||
    fullText.includes('gtag("config", "aw-') ||
    fullText.includes("gtag('config','aw-") ||
    fullText.includes("gtag('event', 'conversion'")
  ) {
    detectedAdPixels.push("Google Ads Conversion");
  }

  if (fullText.includes("analytics.tiktok.com") || fullText.includes("ttq.load") || fullText.includes("ttq.page")) {
    detectedAdPixels.push("TikTok Ads Pixel");
  }

  if (fullText.includes("snap.licdn.com") || fullText.includes("_linkedin_partner_id")) {
    detectedAdPixels.push("LinkedIn Insight Tag");
  }

  const hasActiveAds = detectedAdPixels.length > 0;
  if (hasActiveAds) {
    detectedTech.push(`Píxeles Ads (${detectedAdPixels.join(", ")})`);
  }

  // ── 2. Detección de Múltiples Sucursales / Multi-Location ──
  const locationHints: string[] = [];
  let locationCount = 1;
  const MULTI_LOCATION_PATTERNS = [
    "/locations",
    "/our-locations",
    "/sucursales",
    "/find-us",
    "/stores",
    "/our-stores",
    "store locator",
    "all locations",
    "nuestras sucursales",
    "locations in",
  ];

  if (MULTI_LOCATION_PATTERNS.some((p) => fullText.includes(p))) {
    locationHints.push("Página /locations o localizador detectado");
    // Heuristic estimation: count city / state occurrences or default to 2+
    const cityMatches = fullText.match(/\b(corona|eastvale|riverside|norco|ontario|chino|fontana|rancho cucamonga)\b/g);
    const uniqueCities = new Set(cityMatches ?? []);
    locationCount = Math.max(2, uniqueCities.size);
    locationHints.push(`${locationCount} sedes estimadas en el Inland Empire`);
    detectedTech.push(`Cadena Multi-Sucursal (~${locationCount} locales)`);
  }

  // ── 3. Escáner y Extracción de Perfiles Sociales ──
  const instagramMatch = fullText.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
  const facebookMatch = fullText.match(/facebook\.com\/([a-zA-Z0-9_.-]+)/i);
  const tiktokMatch = fullText.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/i);
  const yelpMatch = fullText.match(/yelp\.com\/biz\/([a-zA-Z0-9_-]+)/i);
  const linkedinMatch = fullText.match(/linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i);

  const socialProfiles = {
    instagram: instagramMatch ? instagramMatch[0] : null,
    facebook: facebookMatch ? facebookMatch[0] : null,
    tiktok: tiktokMatch ? tiktokMatch[0] : null,
    yelp: yelpMatch ? yelpMatch[0] : null,
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
  };

  const hasSocialPresence = Boolean(
    socialProfiles.instagram ||
    socialProfiles.facebook ||
    socialProfiles.tiktok ||
    socialProfiles.yelp ||
    socialProfiles.linkedin ||
    SOCIAL_DOMAINS.some((d) => fullText.includes(d))
  );

  const lastPostAgeDays = estimateLastPostAge(content.markdown ?? "", meta);

  const socialFunnelGap = hasSocialPresence && (isParkedOrBroken || domainStatus === "parked" || wordCount < 40);

  return {
    has_chat: anyMatch(CHAT_KEYWORDS),
    has_whatsapp: anyMatch(WHATSAPP_KEYWORDS),
    has_booking: anyMatch(BOOKING_KEYWORDS),
    has_contact_form:
      fullText.includes("name=") &&
      (fullText.includes("contact") || fullText.includes("contacto")) &&
      (fullText.includes("submit") || fullText.includes("enviar")),
    has_blog: anyMatch(BLOG_KEYWORDS),
    has_testimonials:
      fullText.includes("testimonial") ||
      fullText.includes("testimonio") ||
      fullText.includes("what our customers say") ||
      fullText.includes("lo que dicen nuestros clientes"),
    mentions_24_7: anyMatch(TWENTY_FOUR_SEVEN),
    has_phone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(content.markdown ?? ""),
    has_email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(content.markdown ?? ""),
    has_address:
      /\b\d+\s+[a-z\s]+(?:street|st|ave|avenue|road|rd|boulevard|blvd|drive|dr|lane|ln|calle|avenida|carrera)\b/i.test(
        content.markdown ?? ""
      ) || /\b\d{5}(?:-\d{4})?\b/.test(content.markdown ?? ""),
    has_social: hasSocialPresence,
    has_viewport_meta: html.includes("name=\"viewport\"") || html.includes("name='viewport'"),
    has_https: websiteUrl.startsWith("https://"),
    has_structured_data:
      html.includes("application/ld+json") || html.includes('itemtype="https://schema.org'),
    is_parked_or_broken: isParkedOrBroken,
    domain_status: domainStatus,
    cms_name: cmsName,
    detected_tech: detectedTech,
    last_post_age_days: lastPostAgeDays,
    word_count: wordCount,
    raw_content_length: (content.markdown ?? "").length + (content.html ?? "").length,

    // ── Nuevas señales avanzadas ──
    has_active_ads: hasActiveAds,
    detected_ad_pixels: detectedAdPixels,
    location_count: locationCount,
    has_multiple_locations: locationCount > 1,
    location_hints: locationHints,
    social_profiles: socialProfiles,
    has_social_presence: hasSocialPresence,
    social_funnel_gap: socialFunnelGap,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Try to estimate when the last blog/news post was published.
 * Returns null if not detected.
 */
function estimateLastPostAge(
  markdown: string,
  meta: Record<string, any>
): number | null {
  // Look for date patterns in ISO format (YYYY-MM-DD)
  const isoMatches = markdown.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/g);
  if (isoMatches && isoMatches.length > 0) {
    // Take the most recent
    const dates = isoMatches
      .map((m) => new Date(m))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    if (dates.length > 0) {
      const ageMs = Date.now() - dates[0].getTime();
      return Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }
  }
  // Look for "X days ago" / "X weeks ago"
  const relativeMatch = markdown.match(/(\d+)\s+(day|week|month)s?\s+ago/i);
  if (relativeMatch) {
    const num = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    if (unit === "day") return num;
    if (unit === "week") return num * 7;
    if (unit === "month") return num * 30;
  }
  return null;
}

/**
 * Convert signals to a 0-100 score for "Brecha Digital" dimension.
 * Higher brecha = more pain = more likely to buy = better score.
 */
export function scoreBrechaDigital(signals: Partial<DigitalSignals>): number {
  // If the website is parked, expired, or down: maximum pain/opportunity (95)
  if (signals.is_parked_or_broken) {
    return 95;
  }

  let score = 0;

  // Major gaps (high pain = high score)
  if (!signals.has_chat) score += 12;
  if (!signals.has_whatsapp) score += 8;
  if (!signals.has_booking) score += 15;
  if (!signals.has_contact_form) score += 10;
  if (!signals.has_blog) score += 5;
  if (!signals.mentions_24_7) score += 12;
  if (!signals.has_social) score += 8;
  if (!signals.has_viewport_meta) score += 6;
  if (!signals.has_https) score += 4;
  if (!signals.has_structured_data) score += 5;
  if (!signals.has_testimonials) score += 5;

  // Outdated content
  if (signals.last_post_age_days != null) {
    if (signals.last_post_age_days > 730) score += 10; // 2+ years
    else if (signals.last_post_age_days > 365) score += 7; // 1+ year
    else if (signals.last_post_age_days > 180) score += 3; // 6+ months
  } else {
    score += 5; // no posts visible
  }

  // Thin content
  if (signals.word_count != null) {
    if (signals.word_count < 200) score += 5;
    else if (signals.word_count < 500) score += 2;
  }

  return Math.min(100, score);
}

/**
 * Score "Gap Operativo" — capacidad operativa del negocio.
 * Sin web/contacto claro = alto gap = necesita receptionist IA, etc.
 */
export function scoreGapOperativo(
  signals: DigitalSignals,
  hasGoogleRating: boolean,
  reviewCount: number | null,
  hasPhone: boolean
): number {
  let score = 0;

  if (!hasPhone) score += 20;
  if (!signals.has_email) score += 8;
  if (!signals.mentions_24_7) score += 15;
  if (!hasGoogleRating) score += 12;
  if (reviewCount !== null && reviewCount < 10) score += 12;
  if (reviewCount !== null && reviewCount < 30) score += 5;
  if (!signals.has_address) score += 8;
  if (!signals.has_contact_form) score += 15;
  if (!signals.has_booking) score += 5;

  return Math.min(100, score);
}
