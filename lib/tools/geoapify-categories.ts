/**
 * Geoapify category mapping for OportunIA Radar.
 *
 * Maps free-text search keywords (as used in the categories table and
 * broad-sector queries) to Geoapify Places API category codes.
 *
 * Geoapify categories follow dot-notation hierarchy:
 *   "catering"             → all food businesses
 *   "catering.restaurant"  → only restaurants
 *
 * Reference: https://apidocs.geoapify.com/docs/places/#categories
 */

/**
 * Keyword → Geoapify category code(s).
 *
 * Each entry maps a lowercase keyword fragment to one or more Geoapify
 * category strings. When the Radar builds a search query, it scans the
 * user's text for these keywords and collects matching categories.
 */
export const KEYWORD_TO_GEOAPIFY: Record<string, string[]> = {
  // ── Construction & Home Services ──────────────────────────────────
  plumber: ["service.construction_and_maintenance.plumber"],
  plumbing: ["service.construction_and_maintenance.plumber"],
  electrician: ["service.construction_and_maintenance.electrician"],
  electrical: ["service.construction_and_maintenance.electrician"],
  contractor: ["service.construction_and_maintenance"],
  construction: ["service.construction_and_maintenance"],
  roofer: ["service.construction_and_maintenance"],
  roofing: ["service.construction_and_maintenance"],
  hvac: ["service.construction_and_maintenance"],
  "home services": ["service.construction_and_maintenance"],
  landscaping: ["service.construction_and_maintenance"],
  landscaper: ["service.construction_and_maintenance"],
  painter: ["service.construction_and_maintenance"],
  painting: ["service.construction_and_maintenance"],
  handyman: ["service.construction_and_maintenance"],
  locksmith: ["service.construction_and_maintenance.locksmith"],
  pest: ["service.pest_control"],
  "pest control": ["service.pest_control"],
  cleaning: ["service.cleaning"],
  cleaner: ["service.cleaning"],
  moving: ["service.moving"],
  mover: ["service.moving"],

  // ── Restaurants & Food ────────────────────────────────────────────
  restaurant: ["catering.restaurant"],
  restaurants: ["catering.restaurant"],
  cafe: ["catering.cafe"],
  coffee: ["catering.cafe"],
  bakery: ["catering.bakery"],
  food: ["catering"],
  bar: ["catering.bar"],
  "fast food": ["catering.fast_food"],
  pizza: ["catering.restaurant.pizza"],
  sushi: ["catering.restaurant.sushi"],
  mexican: ["catering.restaurant.mexican"],
  chinese: ["catering.restaurant.chinese"],
  italian: ["catering.restaurant.italian"],
  thai: ["catering.restaurant.thai"],
  indian: ["catering.restaurant.indian"],

  // ── Auto & Vehicle ────────────────────────────────────────────────
  "auto repair": ["service.vehicle.repair"],
  "auto shop": ["service.vehicle.repair"],
  mechanic: ["service.vehicle.repair"],
  mechanics: ["service.vehicle.repair"],
  "body shop": ["service.vehicle.body_repair"],
  "tire shop": ["service.vehicle.tires"],
  tires: ["service.vehicle.tires"],
  "car wash": ["service.vehicle.car_wash"],
  "car dealer": ["commercial.vehicle"],
  "auto parts": ["commercial.vehicle"],

  // ── Healthcare & Medical ──────────────────────────────────────────
  dentist: ["healthcare.dentist"],
  dental: ["healthcare.dentist"],
  doctor: ["healthcare.doctor"],
  clinic: ["healthcare.clinic_or_praxis"],
  clinics: ["healthcare.clinic_or_praxis"],
  medical: ["healthcare"],
  hospital: ["healthcare.hospital"],
  pharmacy: ["healthcare.pharmacy"],
  veterinary: ["healthcare.veterinary"],
  vet: ["healthcare.veterinary"],
  chiropractor: ["healthcare"],
  optician: ["healthcare.optician"],
  therapy: ["healthcare"],
  therapist: ["healthcare"],
  "physical therapy": ["healthcare"],

  // ── Beauty & Personal Care ────────────────────────────────────────
  "beauty salon": ["service.beauty.hairdresser"],
  "hair salon": ["service.beauty.hairdresser"],
  hairdresser: ["service.beauty.hairdresser"],
  barbershop: ["service.beauty.barber"],
  barber: ["service.beauty.barber"],
  spa: ["service.beauty.spa"],
  nails: ["service.beauty.nails"],
  "nail salon": ["service.beauty.nails"],
  massage: ["service.beauty.massage"],
  beauty: ["service.beauty"],

  // ── Fitness & Sports ──────────────────────────────────────────────
  gym: ["sport.fitness"],
  fitness: ["sport.fitness"],
  yoga: ["sport.fitness"],
  "martial arts": ["sport.martial_arts"],

  // ── Professional Services ─────────────────────────────────────────
  lawyer: ["office.lawyer"],
  legal: ["office.lawyer"],
  attorney: ["office.lawyer"],
  accountant: ["office.accountant"],
  accounting: ["office.accountant"],
  insurance: ["office.insurance"],
  "real estate": ["office.estate_agent"],
  realtor: ["office.estate_agent"],
  "tax preparation": ["office.accountant"],
  consultant: ["office"],

  // ── Retail & Commercial ───────────────────────────────────────────
  store: ["commercial"],
  stores: ["commercial"],
  retail: ["commercial"],
  shopping: ["commercial.shopping_mall"],
  supermarket: ["commercial.supermarket"],
  grocery: ["commercial.supermarket"],
  clothing: ["commercial.clothing"],
  electronics: ["commercial.electronics"],
  furniture: ["commercial.furniture"],
  hardware: ["commercial.hardware_and_tools"],
  pet: ["commercial.pet"],
  "pet store": ["commercial.pet"],
  florist: ["commercial.florist"],
  jewelry: ["commercial.jewelry"],

  // ── Education ─────────────────────────────────────────────────────
  school: ["education.school"],
  tutoring: ["education"],
  daycare: ["childcare"],
  "child care": ["childcare"],
  preschool: ["childcare"],

  // ── Accommodation ─────────────────────────────────────────────────
  hotel: ["accommodation.hotel"],
  motel: ["accommodation.motel"],

  // ── Finance ───────────────────────────────────────────────────────
  bank: ["service.financial.bank"],
  "credit union": ["service.financial.bank"],

  // ── Generic / broad ───────────────────────────────────────────────
  "local businesses": ["commercial", "service", "catering"],
  business: ["commercial", "service"],
  services: ["service"],
};

/**
 * Given a free-text query (e.g. "plumbers near Eastvale" or
 * "restaurants, cafes, bakeries, food"), extract matching Geoapify
 * category codes.
 *
 * Returns a deduplicated array of category codes, or an empty array if
 * no keywords matched (caller should fall back to text-based search).
 */
export function extractGeoapifyCategories(query: string): string[] {
  const lower = query.toLowerCase();
  const matched = new Set<string>();

  // Sort keys by length descending so longer phrases match first
  const sortedKeys = Object.keys(KEYWORD_TO_GEOAPIFY).sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeys) {
    if (lower.includes(keyword)) {
      for (const cat of KEYWORD_TO_GEOAPIFY[keyword]) {
        matched.add(cat);
      }
    }
  }

  return [...matched];
}

/**
 * Build Geoapify-compatible categories filter string from extracted categories.
 * Returns comma-separated string ready for the `categories` query parameter.
 */
export function buildCategoryFilter(categories: string[]): string {
  return categories.join(",");
}
