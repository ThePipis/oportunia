/**
 * Category & Business Type Internationalization (i18n)
 *
 * Translates Google Places types, Yelp categories, and custom search tags
 * between Spanish and English for clean, localized display across Radar,
 * tables, filter chips, and business cards.
 */

const CATEGORY_TRANSLATIONS_ES: Record<string, string> = {
  // Common retail & services
  store: "Tienda / Comercio",
  shipping_service: "Envíos y Paquetería",
  "shipping service": "Envíos y Paquetería",
  post_office: "Oficina Postal / Envíos",
  jewelry_store: "Joyería",
  "jewelry store": "Joyería",
  jewelry: "Joyería",
  sandwich_shop: "Sandwichería / Comida Rápida",
  "sandwich shop": "Sandwichería / Comida Rápida",
  car_repair: "Taller Mecánico / Tinte",
  "car repair": "Taller Mecánico / Tinte",
  auto_repair: "Taller Mecánico",
  "auto repair": "Taller Mecánico",
  tire_shop: "Taller de Neumáticos / Llantas",
  "tire shop": "Taller de Neumáticos / Llantas",
  tires: "Llantas / Neumáticos",
  catering_service: "Servicio de Catering / Eventos",
  "catering service": "Servicio de Catering / Eventos",
  catering: "Servicio de Catering",
  meal_takeaway: "Comida para Llevar",
  meal_delivery: "Entrega a Domicilio",
  donut_shop: "Donas / Pastelería",
  "donut shop": "Donas / Pastelería",
  convenience_store: "Tienda de Conveniencia",
  "convenience store": "Tienda de Conveniencia",
  cafe: "Cafetería",
  coffee_shop: "Cafetería",
  "coffee shop": "Cafetería",
  bakery: "Panadería / Pastelería",
  restaurant: "Restaurante",
  grocery_store: "Supermercado / Abarrotes",
  "grocery store": "Supermercado / Abarrotes",
  supermarket: "Supermercado",
  pet_store: "Tienda de Mascotas",
  "pet store": "Tienda de Mascotas",
  petsmart: "Tienda de Mascotas",
  pet_care: "Cuidado de Mascotas / Veterinaria",
  veterinary_care: "Veterinaria / Mascotas",
  
  // High Ticket Agency Niches
  plumber: "Plomería",
  plumbing: "Plomería",
  hvac: "Climatización (HVAC)",
  "hvac contractor": "Climatización (HVAC)",
  contractor: "Contratista General",
  general_contractor: "Contratista General",
  "general contractor": "Contratista General",
  electrician: "Electricista",
  roofing_contractor: "Tejados / Roofing",
  "roofing contractor": "Tejados / Roofing",
  painter: "Pintor / Acabados",
  locksmith: "Cerrajería",
  cleaning_services: "Servicios de Limpieza",
  landscaping: "Jardinería & Paisajismo",
  moving_company: "Mudanzas & Transporte",
  
  // Professional & Healthcare
  // Professional & Healthcare
  dentist: "Dentista / Odontología",
  dental_clinic: "Clínica Dental",
  doctor: "Médico / Clínica",
  health: "Salud / Clínica",
  physiotherapist: "Fisioterapia / Quiropráctico",
  lawyer: "Abogados / Bufete Legal",
  legal_services: "Servicios Legales",
  accounting: "Contabilidad & Impuestos (CPA)",
  accounting_firm: "Firma Contable / CPA",
  "accounting firm": "Firma Contable / CPA",
  financial_planner: "Asesoría Financiera",
  insurance_agency: "Agencia de Seguros",
  real_estate_agency: "Bienes Raíces / Inmobiliaria",
  "real estate": "Bienes Raíces",
  "real estate agency": "Bienes Raíces / Inmobiliaria",
  
  // Custom, Corporate, Industry & Niche Services
  embroidery: "Bordados / Confección",
  embroidery_service: "Bordados & Estampados",
  "embroidery service": "Bordados & Estampados",
  embroidery_shop: "Taller de Bordados",
  "embroidery shop": "Taller de Bordados",
  corporate_office: "Oficina Corporativa / Empresa",
  "corporate office": "Oficina Corporativa / Empresa",
  corporate: "Corporativo / Empresa",
  company: "Empresa / Corporativo",
  general_business: "Negocio Local / Empresa",
  local_business: "Negocio Local / Empresa",
  commercial: "Comercio / Servicios",
  point_of_interest: "Negocio Local",
  establishment: "Negocio Local",
  wholesale: "Distribuidor Mayorista",
  wholesaler: "Distribuidor Mayorista",
  manufacturer: "Fabricación & Manufactura",
  manufacturing: "Fabricación & Manufactura",
  consultant: "Consultoría & Servicios",
  consulting: "Consultoría & Servicios",
  marketing_agency: "Agencia de Marketing",
  printing_service: "Imprenta & Publicidad",
  "printing service": "Imprenta & Publicidad",
  auto_parts_store: "Repuestos Automotrices",
  "auto parts store": "Repuestos Automotrices",
  home_goods_store: "Artículos del Hogar",
  "home goods store": "Artículos del Hogar",
  dry_cleaner: "Tintorería & Lavandería",
  "dry cleaner": "Tintorería & Lavandería",
  laundromat: "Lavandería",
  
  // Hospitality & Lifestyle
  beauty_salon: "Salón de Belleza",
  hair_salon: "Peluquería / Barbería",
  hair_care: "Peluquería / Barbería",
  hairdresser: "Peluquería / Barbería",
  "service beauty hairdresser": "Peluquería / Barbería",
  "service.beauty.hairdresser": "Peluquería / Barbería",
  barber_shop: "Barbería",
  "barber shop": "Barbería",
  barber: "Barbería",
  spa: "Spa & Bienestar",
  "service beauty spa": "Spa & Bienestar",
  "service.beauty.spa": "Spa & Bienestar",
  "service beauty massage": "Masajes & Spa",
  "service.beauty.massage": "Masajes & Spa",
  "service beauty": "Estética & Belleza",
  "service.beauty": "Estética & Belleza",
  "service vehicle repair": "Taller Mecánico",
  "service.vehicle.repair": "Taller Mecánico",
  "service vehicle car wash": "Lavado de Autos (Car Wash)",
  "service.vehicle.car_wash": "Lavado de Autos (Car Wash)",
  "commercial food and drink bakery": "Panadería / Pastelería",
  "commercial.food_and_drink.bakery": "Panadería / Pastelería",
  "commercial food and drink": "Alimentos y Bebidas",
  "catering restaurant": "Restaurante",
  "catering.restaurant": "Restaurante",
  "catering cafe": "Cafetería",
  "catering.cafe": "Cafetería",
  "healthcare dentist": "Dentista / Odontología",
  "healthcare.dentist": "Dentista / Odontología",
  "healthcare clinic or praxis": "Clínica Médica",
  "healthcare.clinic_or_praxis": "Clínica Médica",
  "pet veterinary": "Veterinaria / Mascotas",
  "pet.veterinary": "Veterinaria / Mascotas",
  "sport fitness": "Gimnasio / Fitness",
  "sport.fitness": "Gimnasio / Fitness",
  "office lawyer": "Abogados / Bufete Legal",
  "office.lawyer": "Abogados / Bufete Legal",
  "office accountant": "Contabilidad & Impuestos (CPA)",
  "office.accountant": "Contabilidad & Impuestos (CPA)",
  gym: "Gimnasio / Fitness",
  fitness_center: "Centro Fitness",
  lodging: "Hotel / Hospedaje",
  hotel: "Hotel / Hospedaje",
  car_wash: "Lavado de Autos (Car Wash)",
  "car wash": "Lavado de Autos (Car Wash)",
  car_dealer: "Concesionario de Autos",
  "car dealer": "Concesionario de Autos",
  car_rental: "Renta de Autos",
  
  // Shopping & Entertainment
  clothing_store: "Tienda de Ropa",
  department_store: "Tienda por Departamentos",
  shoe_store: "Zapatería",
  electronics_store: "Electrónica y Tecnología",
  hardware_store: "Ferretería",
  furniture_store: "Mueblería",
  florist: "Florería",
  liquor_store: "Licorería",
  pharmacy: "Farmacia",
  book_store: "Librería",
  bar: "Bar / Pub",
  nightclub: "Discoteca / Club Nocturno",
  amusement_park: "Parque de Diversiones",
  art_gallery: "Galería de Arte",
  bowling_alley: "Boliche / Bowling",
  cinema: "Cine / Teatro",
  movie_theater: "Cine",
  storage: "Almacenamiento / Mini Bodegas",
  church: "Iglesia / Centro Comunitario",
  school: "Escuela / Centro Educativo",
};

const CATEGORY_TRANSLATIONS_EN: Record<string, string> = {
  store: "Store / Retail",
  shipping_service: "Shipping Service",
  "shipping service": "Shipping Service",
  post_office: "Post Office / Shipping",
  jewelry_store: "Jewelry Store",
  "jewelry store": "Jewelry Store",
  jewelry: "Jewelry Store",
  sandwich_shop: "Sandwich Shop",
  "sandwich shop": "Sandwich Shop",
  car_repair: "Auto Repair & Tint",
  "car repair": "Auto Repair & Tint",
  auto_repair: "Auto Repair",
  donut_shop: "Donut Shop / Bakery",
  "donut shop": "Donut Shop / Bakery",
  convenience_store: "Convenience Store",
  "convenience store": "Convenience Store",
  cafe: "Café / Coffee",
  coffee_shop: "Coffee Shop",
  bakery: "Bakery",
  restaurant: "Restaurant",
  grocery_store: "Grocery Store",
  "grocery store": "Grocery Store",
  supermarket: "Supermarket",
  pet_store: "Pet Store",
  veterinary_care: "Veterinary / Pet Care",
  plumber: "Plumbing Services",
  plumbing: "Plumbing Services",
  hvac: "HVAC Services",
  contractor: "General Contractor",
  general_contractor: "General Contractor",
  electrician: "Electrician",
  dentist: "Dental Clinic",
  doctor: "Doctor / Medical",
  lawyer: "Law Firm / Attorney",
  accounting: "Accounting & CPA",
  real_estate_agency: "Real Estate Agency",
  beauty_salon: "Beauty Salon",
  hair_salon: "Hair Salon / Barbershop",
  hairdresser: "Hair Salon / Barbershop",
  "service.beauty.hairdresser": "Hair Salon / Barbershop",
  gym: "Gym & Fitness",
  lodging: "Hotel & Lodging",
  car_wash: "Car Wash",
  car_dealer: "Car Dealership",
  embroidery: "Embroidery & Apparel",
  embroidery_service: "Embroidery & Custom Stitching",
  corporate_office: "Corporate Office",
  company: "Company / Corporate",
  general_business: "Local Business / Company",
  point_of_interest: "Local Business",
  establishment: "Local Business",
};

/**
 * Clean and translate a category key or raw Google/Yelp/Geoapify type
 */
export function translateCategory(
  raw: string | null | undefined,
  locale: "es" | "en" = "es"
): string {
  if (!raw || raw.trim().length === 0) return "—";

  const lower = raw.toLowerCase().trim();
  const cleanKey = lower.replace(/[\-_.]+/g, " ");
  const directKey = lower.replace(/[\-.\s]+/g, "_");
  const leafKey = lower.split(".").pop()?.replace(/[\-_]+/g, " ") || "";

  if (locale === "es") {
    // 1. Direct match in Spanish dictionary
    if (CATEGORY_TRANSLATIONS_ES[lower]) return CATEGORY_TRANSLATIONS_ES[lower];
    if (CATEGORY_TRANSLATIONS_ES[cleanKey]) return CATEGORY_TRANSLATIONS_ES[cleanKey];
    if (CATEGORY_TRANSLATIONS_ES[directKey]) return CATEGORY_TRANSLATIONS_ES[directKey];
    if (CATEGORY_TRANSLATIONS_ES[leafKey]) return CATEGORY_TRANSLATIONS_ES[leafKey];

    // 2. Partial substring matching
    for (const [key, translated] of Object.entries(CATEGORY_TRANSLATIONS_ES)) {
      if (cleanKey.includes(key) || key.includes(cleanKey)) {
        return translated;
      }
    }
  } else {
    // English mapping
    if (CATEGORY_TRANSLATIONS_EN[lower]) return CATEGORY_TRANSLATIONS_EN[lower];
    if (CATEGORY_TRANSLATIONS_EN[cleanKey]) return CATEGORY_TRANSLATIONS_EN[cleanKey];
    if (CATEGORY_TRANSLATIONS_EN[directKey]) return CATEGORY_TRANSLATIONS_EN[directKey];
    if (CATEGORY_TRANSLATIONS_EN[leafKey]) return CATEGORY_TRANSLATIONS_EN[leafKey];
  }

  // 3. Fallback clean title case
  const target = leafKey || cleanKey;
  const words = target.split(" ");
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
