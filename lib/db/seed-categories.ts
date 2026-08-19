/**
 * Seed: categories table
 *
 * Inserts the 12 hardcoded "quick pick" categories + ~50 common Google
 * Places types for the radar tag input. Idempotent (uses INSERT OR IGNORE).
 *
 * Run: npm run db:seed-categories
 */

import { getDb, closeDb } from "./client";

interface SeedCategory {
  id: string;
  display_name: string;
  icon: string;
  query: string;
  aliases?: string[];
  is_quick_pick: 0 | 1;
  sort_order: number;
}

// Quick picks (12 hardcoded) — these show in "Acceso rápido"
const QUICK_PICKS: SeedCategory[] = [
  { id: "real_estate_agency", display_name: "Real Estate", icon: "🏠", query: "real estate agency", is_quick_pick: 1, sort_order: 1 },
  { id: "restaurant",          display_name: "Restaurant",  icon: "🍽️", query: "restaurant",          is_quick_pick: 1, sort_order: 2 },
  { id: "lodging",             display_name: "Hotel",       icon: "🏨", query: "hotel",               is_quick_pick: 1, sort_order: 3 },
  { id: "gym",                 display_name: "Gym",         icon: "💪", query: "gym fitness center",  is_quick_pick: 1, sort_order: 4 },
  { id: "dentist",             display_name: "Dentist",     icon: "🦷", query: "dentist",             is_quick_pick: 1, sort_order: 5 },
  { id: "lawyer",              display_name: "Lawyer",      icon: "⚖️", query: "lawyer attorney",     is_quick_pick: 1, sort_order: 6 },
  { id: "beauty_salon",        display_name: "Beauty Salon", icon: "💇", query: "beauty salon",       is_quick_pick: 1, sort_order: 7 },
  { id: "accounting",          display_name: "Accounting",  icon: "📊", query: "accountant cpa",      is_quick_pick: 1, sort_order: 8 },
  { id: "plumber",             display_name: "Plumber",     icon: "🔧", query: "plumber",             is_quick_pick: 1, sort_order: 9 },
  { id: "hvac",                display_name: "HVAC",        icon: "❄️", query: "hvac contractor",     is_quick_pick: 1, sort_order: 10 },
  { id: "general_contractor",  display_name: "Contractor",  icon: "🔨", query: "general contractor",  is_quick_pick: 1, sort_order: 11 },
  { id: "car_repair",          display_name: "Auto Repair", icon: "🚗", query: "auto repair shop",    is_quick_pick: 1, sort_order: 12 },
];

// Extended catalog (~50 more Google Places types) — discoverable via search
const EXTENDED: SeedCategory[] = [
  { id: "accounting_ext",      display_name: "Accounting Firm",      icon: "📒", query: "accounting",          is_quick_pick: 0, sort_order: 13 },
  { id: "airport",             display_name: "Airport",              icon: "✈️", query: "airport",             is_quick_pick: 0, sort_order: 14 },
  { id: "amusement_park",      display_name: "Amusement Park",       icon: "🎢", query: "amusement park",      is_quick_pick: 0, sort_order: 15 },
  { id: "art_gallery",         display_name: "Art Gallery",          icon: "🎨", query: "art gallery",         is_quick_pick: 0, sort_order: 16 },
  { id: "atm",                 display_name: "ATM",                  icon: "🏧", query: "atm",                 is_quick_pick: 0, sort_order: 17 },
  { id: "bakery",              display_name: "Bakery",               icon: "🥐", query: "bakery",              is_quick_pick: 0, sort_order: 18 },
  { id: "bank",                display_name: "Bank",                 icon: "🏦", query: "bank",                is_quick_pick: 0, sort_order: 19 },
  { id: "bar",                 display_name: "Bar",                  icon: "🍺", query: "bar",                 is_quick_pick: 0, sort_order: 20 },
  { id: "bicycle_store",       display_name: "Bike Shop",            icon: "🚴", query: "bicycle store",       is_quick_pick: 0, sort_order: 21 },
  { id: "book_store",          display_name: "Bookstore",            icon: "📚", query: "book store",          is_quick_pick: 0, sort_order: 22 },
  { id: "bowling_alley",       display_name: "Bowling",              icon: "🎳", query: "bowling alley",       is_quick_pick: 0, sort_order: 23 },
  { id: "cafe",                display_name: "Café",                 icon: "☕", query: "cafe",                is_quick_pick: 0, sort_order: 24 },
  { id: "car_dealer",          display_name: "Car Dealer",           icon: "🚙", query: "car dealer",          is_quick_pick: 0, sort_order: 25 },
  { id: "car_rental",          display_name: "Car Rental",           icon: "🔑", query: "car rental",          is_quick_pick: 0, sort_order: 26 },
  { id: "car_wash",            display_name: "Car Wash",             icon: "🚿", query: "car wash",            is_quick_pick: 0, sort_order: 27 },
  { id: "casino",              display_name: "Casino",               icon: "🎰", query: "casino",              is_quick_pick: 0, sort_order: 28 },
  { id: "church",              display_name: "Church",               icon: "⛪", query: "church",              is_quick_pick: 0, sort_order: 29 },
  { id: "clothing_store",      display_name: "Clothing Store",       icon: "👕", query: "clothing store",      is_quick_pick: 0, sort_order: 30 },
  { id: "convenience_store",   display_name: "Convenience Store",    icon: "🏪", query: "convenience store",   is_quick_pick: 0, sort_order: 31 },
  { id: "department_store",    display_name: "Department Store",     icon: "🏬", query: "department store",    is_quick_pick: 0, sort_order: 32 },
  { id: "doctor",              display_name: "Doctor / Clinic",      icon: "🩺", query: "doctor clinic",       is_quick_pick: 0, sort_order: 33 },
  { id: "drugstore",           display_name: "Pharmacy",             icon: "💊", query: "pharmacy drugstore",  is_quick_pick: 0, sort_order: 34 },
  { id: "electrician",         display_name: "Electrician",          icon: "⚡", query: "electrician",         is_quick_pick: 0, sort_order: 35 },
  { id: "electronics_store",   display_name: "Electronics Store",    icon: "📱", query: "electronics store",   is_quick_pick: 0, sort_order: 36 },
  { id: "florist",             display_name: "Florist",              icon: "💐", query: "florist",             is_quick_pick: 0, sort_order: 37 },
  { id: "furniture_store",     display_name: "Furniture Store",      icon: "🛋️", query: "furniture store",     is_quick_pick: 0, sort_order: 38 },
  { id: "gas_station",         display_name: "Gas Station",          icon: "⛽", query: "gas station",         is_quick_pick: 0, sort_order: 39 },
  { id: "hair_care",           display_name: "Hair Salon",           icon: "💇", query: "hair care salon",     is_quick_pick: 0, sort_order: 40 },
  { id: "hardware_store",      display_name: "Hardware Store",       icon: "🔨", query: "hardware store",      is_quick_pick: 0, sort_order: 41 },
  { id: "home_goods_store",    display_name: "Home Goods",           icon: "🏠", query: "home goods store",    is_quick_pick: 0, sort_order: 42 },
  { id: "hospital",            display_name: "Hospital",             icon: "🏥", query: "hospital",            is_quick_pick: 0, sort_order: 43 },
  { id: "insurance_agency",    display_name: "Insurance Agency",     icon: "🛡️", query: "insurance agency",    is_quick_pick: 0, sort_order: 44 },
  { id: "jewelry_store",       display_name: "Jewelry Store",        icon: "💍", query: "jewelry store",       is_quick_pick: 0, sort_order: 45 },
  { id: "laundry",             display_name: "Laundry",              icon: "🧺", query: "laundry",             is_quick_pick: 0, sort_order: 46 },
  { id: "locksmith",           display_name: "Locksmith",            icon: "🔐", query: "locksmith",           is_quick_pick: 0, sort_order: 47 },
  { id: "meal_takeaway",       display_name: "Takeout",              icon: "🥡", query: "meal takeaway",       is_quick_pick: 0, sort_order: 48 },
  { id: "mosque",              display_name: "Mosque",               icon: "🕌", query: "mosque",              is_quick_pick: 0, sort_order: 49 },
  { id: "movie_theater",       display_name: "Movie Theater",        icon: "🎬", query: "movie theater",       is_quick_pick: 0, sort_order: 50 },
  { id: "moving_company",      display_name: "Moving Company",       icon: "📦", query: "moving company",      is_quick_pick: 0, sort_order: 51 },
  { id: "museum",              display_name: "Museum",               icon: "🏛️", query: "museum",              is_quick_pick: 0, sort_order: 52 },
  { id: "night_club",          display_name: "Nightclub",            icon: "🪩", query: "night club",          is_quick_pick: 0, sort_order: 53 },
  { id: "painter",             display_name: "Painter",              icon: "🎨", query: "painter",             is_quick_pick: 0, sort_order: 54 },
  { id: "park",                display_name: "Park",                 icon: "🌳", query: "park",                is_quick_pick: 0, sort_order: 55 },
  { id: "pet_store",           display_name: "Pet Store",            icon: "🐾", query: "pet store",           is_quick_pick: 0, sort_order: 56 },
  { id: "physiotherapist",     display_name: "Physiotherapist",      icon: "🧘", query: "physiotherapist",     is_quick_pick: 0, sort_order: 57 },
  { id: "roofing_contractor",  display_name: "Roofing Contractor",   icon: "🏘️", query: "roofing contractor",  is_quick_pick: 0, sort_order: 58 },
  { id: "school",              display_name: "School",               icon: "🏫", query: "school",              is_quick_pick: 0, sort_order: 59 },
  { id: "shoe_store",          display_name: "Shoe Store",           icon: "👟", query: "shoe store",          is_quick_pick: 0, sort_order: 60 },
  { id: "shopping_mall",       display_name: "Shopping Mall",        icon: "🛍️", query: "shopping mall",       is_quick_pick: 0, sort_order: 61 },
  { id: "spa",                 display_name: "Spa",                  icon: "💆", query: "spa",                 is_quick_pick: 0, sort_order: 62 },
  { id: "supermarket",         display_name: "Supermarket",          icon: "🛒", query: "supermarket",         is_quick_pick: 0, sort_order: 63 },
  { id: "taxi_stand",          display_name: "Taxi Service",         icon: "🚕", query: "taxi service",        is_quick_pick: 0, sort_order: 64 },
  { id: "tourist_attraction",  display_name: "Tourist Attraction",   icon: "🗼", query: "tourist attraction",  is_quick_pick: 0, sort_order: 65 },
  { id: "travel_agency",       display_name: "Travel Agency",        icon: "🧳", query: "travel agency",       is_quick_pick: 0, sort_order: 66 },
  { id: "veterinary_care",     display_name: "Veterinarian",         icon: "🐶", query: "veterinarian",        is_quick_pick: 0, sort_order: 67 },
  { id: "carpet_cleaning",     display_name: "Carpet Cleaning",      icon: "🧹", query: "carpet cleaning service", is_quick_pick: 0, sort_order: 68 },
  { id: "cleaning_service",    display_name: "Cleaning Service",     icon: "🧽", query: "cleaning service",    is_quick_pick: 0, sort_order: 69 },
  { id: "pest_control",        display_name: "Pest Control",         icon: "🪲", query: "pest control service", is_quick_pick: 0, sort_order: 70 },
  { id: "pool_service",        display_name: "Pool Service",         icon: "🏊", query: "pool cleaning service", is_quick_pick: 0, sort_order: 71 },
  { id: "landscaping",         display_name: "Landscaping",          icon: "🌿", query: "landscaping service", is_quick_pick: 0, sort_order: 72 },
  { id: "auto_parts",          display_name: "Auto Parts Store",     icon: "🔧", query: "auto parts store",    is_quick_pick: 0, sort_order: 73 },
  { id: "tire_shop",           display_name: "Tire Shop",            icon: "🛞", query: "tire shop",           is_quick_pick: 0, sort_order: 74 },
  { id: "car_wash_detail",     display_name: "Car Detailing",        icon: "✨", query: "car detailing",       is_quick_pick: 0, sort_order: 75 },
];

const ALL = [...QUICK_PICKS, ...EXTENDED];

function main() {
  console.log(`🌱 Seeding ${ALL.length} categories (${QUICK_PICKS.length} quick picks + ${EXTENDED.length} extended)...`);
  const db = getDb();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO categories
      (id, display_name, display_name_en, icon, query, aliases, is_quick_pick, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  let skipped = 0;
  for (const r of ALL) {
    const res = stmt.run(
      r.id,
      r.display_name,
      r.display_name,
      r.icon,
      r.query,
      r.aliases ? JSON.stringify(r.aliases) : null,
      r.is_quick_pick,
      r.sort_order
    );
    if (res.changes > 0) inserted++;
    else skipped++;
  }

  const total = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c;
  console.log(`   ✓ ${inserted} nuevas, ${skipped} ya existían. Total en DB: ${total}`);

  // Resumen por quick_pick
  const quickTotal = (db.prepare("SELECT COUNT(*) as c FROM categories WHERE is_quick_pick = 1").get() as { c: number }).c;
  console.log(`   ✓ ${quickTotal} en "Acceso rápido"`);

  closeDb();
}

main();
