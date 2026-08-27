/**
 * Geoapify category mapping for OportunIA Radar.
 *
 * Maps free-text search keywords (as used in the categories table and
 * broad-sector queries) to 100% verified valid Geoapify Places API category codes.
 *
 * Reference: https://apidocs.geoapify.com/docs/places/#categories
 */

export const KEYWORD_TO_GEOAPIFY: Record<string, string[]> = {
  // ── Construction & Home Services ──────────────────────────────────
  plumber: ["service", "commercial.houseware_and_hardware.building_materials"],
  plumbing: ["service", "commercial.houseware_and_hardware.building_materials"],
  electrician: ["service"],
  electrical: ["service"],
  contractor: ["service", "building"],
  construction: ["building", "commercial.houseware_and_hardware.building_materials"],
  roofer: ["service", "building"],
  roofing: ["service", "building"],
  hvac: ["service"],
  "home services": ["service"],
  landscaping: ["service"],
  landscaper: ["service"],
  painter: ["service"],
  painting: ["service"],
  handyman: ["service"],
  locksmith: ["service"],
  pest: ["service"],
  "pest control": ["service"],
  cleaning: ["service.cleaning"],
  cleaner: ["service.cleaning"],
  moving: ["service"],
  mover: ["service"],

  // ── Restaurants & Food ────────────────────────────────────────────
  restaurant: ["catering.restaurant"],
  restaurants: ["catering.restaurant"],
  cafe: ["catering.cafe"],
  coffee: ["catering.cafe"],
  bakery: ["commercial.food_and_drink.bakery"],
  food: ["catering", "commercial.food_and_drink"],
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
  "body shop": ["service.vehicle.repair"],
  "tire shop": ["service.vehicle.repair"],
  tires: ["service.vehicle.repair"],
  "car wash": ["service.vehicle.car_wash"],
  "car dealer": ["commercial.vehicle"],
  "auto parts": ["commercial.vehicle"],

  // ── Healthcare & Medical ──────────────────────────────────────────
  dentist: ["healthcare.dentist"],
  dental: ["healthcare.dentist"],
  doctor: ["healthcare.clinic_or_praxis"],
  clinic: ["healthcare.clinic_or_praxis"],
  clinics: ["healthcare.clinic_or_praxis"],
  medical: ["healthcare"],
  hospital: ["healthcare.hospital"],
  pharmacy: ["healthcare.pharmacy"],
  veterinary: ["pet.veterinary"],
  vet: ["pet.veterinary"],
  chiropractor: ["healthcare.clinic_or_praxis"],
  optician: ["commercial.health_and_beauty.optician"],
  therapy: ["healthcare.clinic_or_praxis"],
  therapist: ["healthcare.clinic_or_praxis"],
  "physical therapy": ["healthcare.clinic_or_praxis"],

  // ── Beauty & Personal Care ────────────────────────────────────────
  "beauty salon": ["service.beauty.hairdresser"],
  "hair salon": ["service.beauty.hairdresser"],
  hairdresser: ["service.beauty.hairdresser"],
  barbershop: ["service.beauty.hairdresser"],
  barber: ["service.beauty.hairdresser"],
  spa: ["service.beauty.spa"],
  nails: ["service.beauty"],
  "nail salon": ["service.beauty"],
  massage: ["service.beauty.massage"],
  beauty: ["service.beauty", "commercial.health_and_beauty"],

  // ── Fitness & Sports ──────────────────────────────────────────────
  gym: ["sport.fitness"],
  fitness: ["sport.fitness"],
  yoga: ["sport.fitness"],
  "martial arts": ["sport.sports_centre"],

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
  consultant: ["office.consulting", "office.company"],

  // ── Retail & Commercial ───────────────────────────────────────────
  store: ["commercial"],
  stores: ["commercial"],
  retail: ["commercial"],
  shopping: ["commercial.shopping_mall"],
  supermarket: ["commercial.supermarket"],
  grocery: ["commercial.supermarket"],
  clothing: ["commercial.clothing"],
  electronics: ["commercial"],
  furniture: ["commercial.furniture_and_interior"],
  hardware: ["commercial.houseware_and_hardware"],
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
 */
export function extractGeoapifyCategories(query: string): string[] {
  const lower = query.toLowerCase();
  const matched = new Set<string>();

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

export function buildCategoryFilter(categories: string[]): string {
  return categories.join(",");
}
