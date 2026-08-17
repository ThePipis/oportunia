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
  last_post_age_days: number | null; // null = no posts or unknown
  word_count: number;
  raw_content_length: number;
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

  // Date detection: try to find last blog post date
  const lastPostAgeDays = estimateLastPostAge(md, meta);

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
    has_social: SOCIAL_DOMAINS.some((d) => fullText.includes(d)),
    has_viewport_meta: html.includes("name=\"viewport\"") || html.includes("name='viewport'"),
    has_https: websiteUrl.startsWith("https://"),
    has_structured_data:
      html.includes("application/ld+json") || html.includes('itemtype="https://schema.org'),
    last_post_age_days: lastPostAgeDays,
    word_count: wordCount,
    raw_content_length: (content.markdown ?? "").length + (content.html ?? "").length,
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
 * Lower is better digital presence (less gap), higher means more gap.
 *
 * Wait: Brecha Digital is the GAP, so 100 = huge gap (bad prospect for AI).
 * Actually no — we want to score PROSPECT QUALITY. A high brecha = good prospect
 * (they need our AI services).
 *
 * Re-read the spec: "Brecha Digital" = "qué tan atrasado está en lo digital"
 * Higher brecha = more pain = more likely to buy = better score.
 */
export function scoreBrechaDigital(signals: DigitalSignals): number {
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
  if (signals.last_post_age_days !== null) {
    if (signals.last_post_age_days > 730) score += 10; // 2+ years
    else if (signals.last_post_age_days > 365) score += 7; // 1+ year
    else if (signals.last_post_age_days > 180) score += 3; // 6+ months
  } else {
    score += 5; // no posts visible
  }

  // Thin content
  if (signals.word_count < 200) score += 5;
  else if (signals.word_count < 500) score += 2;

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
