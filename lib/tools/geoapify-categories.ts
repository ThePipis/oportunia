/**
 * Geoapify category mapping for OportunIA Radar.
 *
 * Maps category IDs (from the categories table) and free-text search keywords
 * to 100% verified valid Geoapify Places API category codes.
 *
 * Reference: https://apidocs.geoapify.com/docs/places/#categories
 */

/**
 * Direct category ID → Geoapify categories mapping.
 * Matches all IDs from SQLite categories table.
 */
export const CATEGORY_ID_TO_GEOAPIFY: Record<string, string[]> = {
  // Beauty & Personal Care
  hair_care: ["service.beauty.hairdresser", "service.beauty"],
  beauty_salon: ["service.beauty.hairdresser", "service.beauty"],
  spa: ["service.beauty.spa", "service.beauty.massage"],

  // Food & Catering
  restaurant: ["catering.restaurant"],
  cafe: ["catering.cafe"],
  bar: ["catering.bar"],
  bakery: ["commercial.food_and_drink.bakery"],
  meal_takeaway: ["catering.fast_food", "catering.restaurant"],

  // Healthcare
  dentist: ["healthcare.dentist"],
  doctor: ["healthcare.clinic_or_praxis"],
  hospital: ["healthcare.hospital"],
  drugstore: ["healthcare.pharmacy"],
  pharmacy: ["healthcare.pharmacy"],
  physiotherapist: ["healthcare.clinic_or_praxis"],
  veterinary_care: ["pet.veterinary"],

  // Trades & Construction
  plumber: ["service", "commercial.houseware_and_hardware.building_materials"],
  electrician: ["service"],
  hvac: ["service"],
  general_contractor: ["service", "building"],
  roofing_contractor: ["service", "building"],
  painter: ["service"],
  locksmith: ["service"],
  carpet_cleaning: ["service.cleaning"],
  cleaning_service: ["service.cleaning"],
  pest_control: ["service"],
  pool_service: ["service"],
  landscaping: ["service"],
  moving_company: ["service"],
  laundry: ["service.cleaning"],

  // Auto & Vehicles
  car_repair: ["service.vehicle.repair"],
  auto_parts: ["commercial.vehicle"],
  tire_shop: ["service.vehicle.repair"],
  car_wash: ["service.vehicle.car_wash"],
  car_wash_detail: ["service.vehicle.car_wash"],
  car_dealer: ["commercial.vehicle"],
  car_rental: ["service.vehicle"],
  gas_station: ["service.vehicle"],

  // Professional Services
  lawyer: ["office.lawyer"],
  accounting: ["office.accountant"],
  accounting_ext: ["office.accountant"],
  insurance_agency: ["office.insurance"],
  travel_agency: ["office.estate_agent"],

  // Retail & Commercial
  clothing_store: ["commercial.clothing"],
  shoe_store: ["commercial.clothing"],
  furniture_store: ["commercial.furniture_and_interior"],
  home_goods_store: ["commercial.furniture_and_interior"],
  electronics_store: ["commercial"],
  hardware_store: ["commercial.houseware_and_hardware"],
  pet_store: ["commercial.pet"],
  florist: ["commercial.florist"],
  jewelry_store: ["commercial.jewelry"],
  book_store: ["commercial"],
  bicycle_store: ["commercial"],
  supermarket: ["commercial.supermarket"],
  convenience_store: ["commercial.supermarket"],
  department_store: ["commercial.shopping_mall"],
  shopping_mall: ["commercial.shopping_mall"],

  // Entertainment & Sports
  gym: ["sport.fitness"],
  bowling_alley: ["sport.sports_centre"],
  movie_theater: ["commercial"],
  night_club: ["catering.bar"],
  amusement_park: ["commercial"],
  art_gallery: ["commercial"],
  museum: ["commercial"],
  park: ["sport"],

  // Education & Accommodation & Public
  school: ["education.school"],
  hotel: ["accommodation.hotel"],
  casino: ["commercial"],
  church: ["building"],
  mosque: ["building"],
  airport: ["service"],
  atm: ["service.financial.bank"],
  bank: ["service.financial.bank"],
  taxi_stand: ["service.vehicle"],
};

/**
 * Keyword-based mapping for free-text search queries.
 */
export const KEYWORD_TO_GEOAPIFY: Record<string, string[]> = {
  // ── Beauty & Hair ────────────────────────────────────────────────
  peluqueria: ["service.beauty.hairdresser", "service.beauty"],
  peluquería: ["service.beauty.hairdresser", "service.beauty"],
  barberia: ["service.beauty.hairdresser", "service.beauty"],
  barbería: ["service.beauty.hairdresser", "service.beauty"],
  hair: ["service.beauty.hairdresser", "service.beauty"],
  salon: ["service.beauty.hairdresser", "service.beauty"],
  barber: ["service.beauty.hairdresser", "service.beauty"],
  barbershop: ["service.beauty.hairdresser", "service.beauty"],
  spa: ["service.beauty.spa", "service.beauty.massage"],
  nails: ["service.beauty"],
  massage: ["service.beauty.massage"],
  beauty: ["service.beauty", "commercial.health_and_beauty"],

  // ── Construction & Home Services ──────────────────────────────────
  plumber: ["service", "commercial.houseware_and_hardware.building_materials"],
  plumbing: ["service", "commercial.houseware_and_hardware.building_materials"],
  plomeria: ["service", "commercial.houseware_and_hardware.building_materials"],
  plomería: ["service", "commercial.houseware_and_hardware.building_materials"],
  electrician: ["service"],
  electrical: ["service"],
  electricista: ["service"],
  contractor: ["service", "building"],
  contratista: ["service", "building"],
  construction: ["building", "commercial.houseware_and_hardware.building_materials"],
  construccion: ["building", "commercial.houseware_and_hardware.building_materials"],
  roofer: ["service", "building"],
  roofing: ["service", "building"],
  techo: ["service", "building"],
  hvac: ["service"],
  aire: ["service"],
  "home services": ["service"],
  landscaping: ["service"],
  landscaper: ["service"],
  jardineria: ["service"],
  painter: ["service"],
  painting: ["service"],
  pintor: ["service"],
  handyman: ["service"],
  locksmith: ["service"],
  cerrajero: ["service"],
  pest: ["service"],
  "pest control": ["service"],
  fumigacion: ["service"],
  cleaning: ["service.cleaning"],
  cleaner: ["service.cleaning"],
  limpieza: ["service.cleaning"],
  moving: ["service"],
  mover: ["service"],
  mudanzas: ["service"],

  // ── Restaurants & Food ────────────────────────────────────────────
  restaurant: ["catering.restaurant"],
  restaurants: ["catering.restaurant"],
  restaurante: ["catering.restaurant"],
  restaurantes: ["catering.restaurant"],
  cafe: ["catering.cafe"],
  cafeteria: ["catering.cafe"],
  coffee: ["catering.cafe"],
  bakery: ["commercial.food_and_drink.bakery"],
  panaderia: ["commercial.food_and_drink.bakery"],
  panadería: ["commercial.food_and_drink.bakery"],
  food: ["catering", "commercial.food_and_drink"],
  comida: ["catering", "commercial.food_and_drink"],
  bar: ["catering.bar"],
  "fast food": ["catering.fast_food"],
  pizza: ["catering.restaurant.pizza"],
  sushi: ["catering.restaurant.sushi"],
  mexican: ["catering.restaurant.mexican"],
  tacos: ["catering.restaurant.mexican"],
  chinese: ["catering.restaurant.chinese"],
  italian: ["catering.restaurant.italian"],
  thai: ["catering.restaurant.thai"],
  indian: ["catering.restaurant.indian"],

  // ── Auto & Vehicle ────────────────────────────────────────────────
  "auto repair": ["service.vehicle.repair"],
  "auto shop": ["service.vehicle.repair"],
  mecanico: ["service.vehicle.repair"],
  mecánico: ["service.vehicle.repair"],
  mechanic: ["service.vehicle.repair"],
  mechanics: ["service.vehicle.repair"],
  "body shop": ["service.vehicle.repair"],
  "tire shop": ["service.vehicle.repair"],
  llantas: ["service.vehicle.repair"],
  tires: ["service.vehicle.repair"],
  "car wash": ["service.vehicle.car_wash"],
  "car dealer": ["commercial.vehicle"],
  "auto parts": ["commercial.vehicle"],

  // ── Healthcare & Medical ──────────────────────────────────────────
  dentist: ["healthcare.dentist"],
  dental: ["healthcare.dentist"],
  dentista: ["healthcare.dentist"],
  doctor: ["healthcare.clinic_or_praxis"],
  medico: ["healthcare.clinic_or_praxis"],
  médico: ["healthcare.clinic_or_praxis"],
  clinic: ["healthcare.clinic_or_praxis"],
  clinica: ["healthcare.clinic_or_praxis"],
  clinics: ["healthcare.clinic_or_praxis"],
  medical: ["healthcare"],
  hospital: ["healthcare.hospital"],
  pharmacy: ["healthcare.pharmacy"],
  farmacia: ["healthcare.pharmacy"],
  veterinary: ["pet.veterinary"],
  veterinaria: ["pet.veterinary"],
  vet: ["pet.veterinary"],
  chiropractor: ["healthcare.clinic_or_praxis"],
  optician: ["commercial.health_and_beauty.optician"],
  optica: ["commercial.health_and_beauty.optician"],
  therapy: ["healthcare.clinic_or_praxis"],
  therapist: ["healthcare.clinic_or_praxis"],
  "physical therapy": ["healthcare.clinic_or_praxis"],

  // ── Fitness & Sports ──────────────────────────────────────────────
  gym: ["sport.fitness"],
  gimnasio: ["sport.fitness"],
  fitness: ["sport.fitness"],
  yoga: ["sport.fitness"],
  "martial arts": ["sport.sports_centre"],

  // ── Professional Services ─────────────────────────────────────────
  lawyer: ["office.lawyer"],
  abogado: ["office.lawyer"],
  legal: ["office.lawyer"],
  attorney: ["office.lawyer"],
  accountant: ["office.accountant"],
  contador: ["office.accountant"],
  accounting: ["office.accountant"],
  contabilidad: ["office.accountant"],
  insurance: ["office.insurance"],
  seguros: ["office.insurance"],
  "real estate": ["office.estate_agent"],
  inmobiliaria: ["office.estate_agent"],
  realtor: ["office.estate_agent"],
  "tax preparation": ["office.accountant"],
  impuestos: ["office.accountant"],
  consultant: ["office.consulting", "office.company"],

  // ── Retail & Commercial ───────────────────────────────────────────
  store: ["commercial"],
  stores: ["commercial"],
  tienda: ["commercial"],
  retail: ["commercial"],
  shopping: ["commercial.shopping_mall"],
  supermarket: ["commercial.supermarket"],
  supermercado: ["commercial.supermarket"],
  grocery: ["commercial.supermarket"],
  clothing: ["commercial.clothing"],
  ropa: ["commercial.clothing"],
  electronics: ["commercial"],
  electronica: ["commercial"],
  furniture: ["commercial.furniture_and_interior"],
  muebles: ["commercial.furniture_and_interior"],
  hardware: ["commercial.houseware_and_hardware"],
  ferreteria: ["commercial.houseware_and_hardware"],
  pet: ["commercial.pet"],
  mascotas: ["commercial.pet"],
  florist: ["commercial.florist"],
  floreria: ["commercial.florist"],
  jewelry: ["commercial.jewelry"],
  joyeria: ["commercial.jewelry"],

  // ── Education ─────────────────────────────────────────────────────
  school: ["education.school"],
  escuela: ["education.school"],
  tutoring: ["education"],
  daycare: ["childcare"],
  "child care": ["childcare"],
  guarderia: ["childcare"],
  preschool: ["childcare"],

  // ── Accommodation ─────────────────────────────────────────────────
  hotel: ["accommodation.hotel"],
  motel: ["accommodation.motel"],

  // ── Finance ───────────────────────────────────────────────────────
  bank: ["service.financial.bank"],
  banco: ["service.financial.bank"],
  "credit union": ["service.financial.bank"],

  // ── Generic / broad ───────────────────────────────────────────────
  "local businesses": ["commercial", "service", "catering"],
  business: ["commercial", "service"],
  services: ["service"],
  servicios: ["service"],
};

/**
 * Given category ID or free-text query, extract matching Geoapify category codes.
 */
export function extractGeoapifyCategories(queryOrId: string): string[] {
  const trimmed = queryOrId.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct match on category ID
  if (CATEGORY_ID_TO_GEOAPIFY[trimmed]) {
    return CATEGORY_ID_TO_GEOAPIFY[trimmed];
  }
  if (CATEGORY_ID_TO_GEOAPIFY[lower]) {
    return CATEGORY_ID_TO_GEOAPIFY[lower];
  }

  // 2. Scan keywords
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
