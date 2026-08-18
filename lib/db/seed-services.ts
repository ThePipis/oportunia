/**
 * Seed script: inserta los 12 servicios AI del catálogo.
 * Idempotente: si ya existen, no los duplica.
 *
 * Uso: npm run db:seed-services
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "radar.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

const SERVICES = [
  // ===== Tier 1: Alta demanda =====
  {
    id: "ai_receptionist_24_7",
    tier: 1,
    name: "AI Receptionist 24/7",
    name_en: "24/7 AI Receptionist",
    icon: "📞",
    description:
      "Contesta llamadas a cualquier hora, en inglés o español. Toma mensajes, agenda citas, transfiere emergencias a un humano.",
    description_en:
      "Answers calls 24/7 in English or Spanish. Takes messages, books appointments, routes emergencies to a human.",
    example:
      "Plomería en Corona. Llamada a las 2 AM por tubería rota → IA agenda visita y avisa al técnico por SMS.",
    example_en:
      "Plumbing in Corona. 2 AM call about burst pipe → AI books visit and texts the on-call tech.",
    pain_solved:
      "Pierden 30-60% de llamadas fuera de horario. Servicio humano cuesta $3,000-5,000/mes.",
    pain_solved_en:
      "Losing 30-60% of calls after hours. Human answering service costs $3,000-5,000/mo.",
    price_setup: 400,
    price_monthly: 300,
    signals: '["mentions_24_7", "has_phone", "is_24_7_emergency"]',
    pitch_template:
      "Detectamos que su negocio recibe llamadas de emergencia fuera de horario. Un AI Receptionist contesta 24/7 en inglés y español, agenda la visita, y transfiere al técnico de guardia. Cuesta 80% menos que un call center humano y nunca pierde una llamada.",
    pitch_template_en:
      "We detected your business receives after-hours emergency calls. A 24/7 AI Receptionist answers in English and Spanish, books the visit, and routes to your on-call tech. Costs 80% less than a human call center and never misses a call.",
    category: "voice",
    sort_order: 10,
  },
  {
    id: "speed_to_lead",
    tier: 1,
    name: "Speed-to-Lead",
    name_en: "Speed-to-Lead",
    icon: "⚡",
    description:
      "Responde por SMS o WhatsApp a leads del sitio web en menos de 60 segundos. Hace preguntas, califica, agenda.",
    description_en:
      "Responds via SMS or WhatsApp to web leads in under 60 seconds. Asks qualifying questions, books appointments.",
    example:
      "Dentista en Chino Hills. Lead pide consulta de Invisalign a las 11 PM → IA responde en 30s, agenda viernes 3 PM.",
    example_en:
      "Dentist in Chino Hills. Lead requests Invisalign consult at 11 PM → AI replies in 30s, books Friday 3 PM.",
    pain_solved:
      "78% de los leads los captura el primero que responde. Hoy responden en 4+ horas (o nunca).",
    pain_solved_en:
      "78% of leads go to the first responder. Today you respond in 4+ hours (or never).",
    price_setup: 250,
    price_monthly: 200,
    signals: '["has_contact_form", "has_website", "review_count_low"]',
    pitch_template:
      "Su sitio web genera leads, pero responder 4+ horas después pierde el 78% de ellos. Una AI Speed-to-Lead responde por SMS en menos de 60 segundos, hace 3 preguntas de calificación, y agenda directo en su calendario. Convierte 3x más sin contratar más gente.",
    pitch_template_en:
      "Your website generates leads, but responding 4+ hours later loses 78% of them. AI Speed-to-Lead responds via SMS in under 60 seconds, asks 3 qualifying questions, and books directly into your calendar. Converts 3x more without hiring more people.",
    category: "lead_capture",
    sort_order: 20,
  },
  {
    id: "ai_appointment_setter",
    tier: 1,
    name: "AI Appointment Setter",
    name_en: "AI Appointment Setter",
    icon: "📅",
    description:
      "Chat en web + WhatsApp que agenda consultas 24/7. Se conecta con Google Calendar o tu sistema actual.",
    description_en:
      "Web chat + WhatsApp bot that books appointments 24/7. Syncs with Google Calendar or your current system.",
    example:
      "Clínica dental. Visitante a las 10 PM → bot hace 4 preguntas, reserva viernes 2 PM sin intervención humana.",
    example_en:
      "Dental clinic. Visitor at 10 PM → bot asks 4 questions, books Friday 2 PM without human intervention.",
    pain_solved:
      "40% de visitantes web quieren agendar pero no pueden (la web no tiene booking). Se van a la competencia.",
    pain_solved_en:
      "40% of web visitors want to book but can't. They go to your competitor instead.",
    price_setup: 400,
    price_monthly: 200,
    signals: '["has_website", "no_booking", "has_contact_form"]',
    pitch_template:
      "Detectamos que su web no permite agendar online. Un AI Appointment Setter con chat + WhatsApp 24/7 cierra citas directo en su calendario. Convierte el 40% de visitantes que se van sin agendar.",
    pitch_template_en:
      "We detected your website doesn't allow online booking. An AI Appointment Setter with 24/7 chat + WhatsApp books directly into your calendar. Converts the 40% of visitors who leave without booking.",
    category: "lead_capture",
    sort_order: 30,
  },
  {
    id: "ai_review_booster",
    tier: 1,
    name: "AI Review Booster",
    name_en: "AI Review Booster",
    icon: "⭐",
    description:
      "Después de cada servicio, manda SMS pidiendo reseña en Google. Si es negativa, la escala al dueño antes de publicar.",
    description_en:
      "After every service, sends SMS asking for a Google review. If negative, escalates to the owner before publishing.",
    example:
      "Técnico HVAC termina trabajo → SMS automático: '¿Cómo le fue? [link Google]' → reseña publicada en 5 min.",
    example_en:
      "HVAC tech finishes job → auto SMS: 'How did we do? [Google link]' → review published in 5 min.",
    pain_solved:
      "80% de clientes felices nunca reseñan. Una sola reseña negativa no respondida puede ahuyentar 30 clientes.",
    pain_solved_en:
      "80% of happy customers never leave reviews. One unanswered negative review can scare off 30 customers.",
    price_setup: 150,
    price_monthly: 150,
    signals: '["has_google_rating", "review_count_low", "primary_type_service"]',
    pitch_template:
      "Detectamos que tiene pocas reseñas y un rating que podría mejorar. AI Review Booster manda SMS automático a cada cliente después del servicio, captura reseñas felices, y desvía las negativas al dueño antes de que se publiquen. 80% de clientes felices nunca reseñan — con esto, sí lo hacen.",
    pitch_template_en:
      "We detected you have few reviews and a rating that could improve. AI Review Booster auto-sends SMS to every customer after service, captures happy reviews, and routes negatives to the owner before publishing. 80% of happy customers never review — with this, they do.",
    category: "reputation",
    sort_order: 40,
  },

  // ===== Tier 2: Alto impacto =====
  {
    id: "ai_reputation_manager",
    tier: 2,
    name: "AI Reputation Manager",
    name_en: "AI Reputation Manager",
    icon: "💬",
    description:
      "Monitorea Google, Yelp y Facebook. Redacta respuestas a reseñas, alerta al dueño si hay una negativa.",
    description_en:
      "Monitors Google, Yelp, Facebook. Drafts review responses, alerts owner if there's a negative one.",
    example:
      "Restaurante recibe 1 estrella a las 8 PM → IA propone respuesta empática, dueño aprueba con 1 clic.",
    example_en:
      "Restaurant gets 1-star at 8 PM → AI drafts empathetic response, owner approves with 1 click.",
    pain_solved:
      "60% de negocios no responden reseñas, perdiendo confianza del cliente.",
    pain_solved_en:
      "60% of businesses don't respond to reviews, losing customer trust.",
    price_setup: 200,
    price_monthly: 150,
    signals: '["has_google_rating", "review_count_high"]',
    pitch_template:
      "60% de negocios no responden reseñas. AI Reputation Manager monitorea Google, Yelp y Facebook 24/7, redacta respuestas con IA, y tú apruebas con 1 clic. 1 respuesta rápida a una negativa puede salvar 30 clientes.",
    pitch_template_en:
      "60% of businesses don't respond to reviews. AI Reputation Manager monitors Google, Yelp and Facebook 24/7, drafts responses with AI, and you approve with 1 click. 1 quick response to a negative can save 30 customers.",
    category: "reputation",
    sort_order: 50,
  },
  {
    id: "ai_outbound_reactivator",
    tier: 2,
    name: "AI Outbound Reactivator",
    name_en: "AI Outbound Reactivator",
    icon: "📞",
    description:
      "IA llama a clientes viejos para ofrecer mantenimiento estacional o reactivación de cuenta.",
    description_en:
      "AI calls old customers to offer seasonal maintenance or account reactivation.",
    example:
      "HVAC. IA llama 200 clientes de 2024: 'Hola, soy María, ¿agendamos su tune-up gratis de AC?'",
    example_en:
      "HVAC. AI calls 200 customers from 2024: 'Hi, this is Maria, want to book your free AC tune-up?'",
    pain_solved:
      "$50,000+ de revenue atrapado en base inactiva. Nadie lo trabaja.",
    pain_solved_en:
      "$50,000+ of revenue trapped in inactive customer base. No one works it.",
    price_setup: 250,
    price_monthly: 300,
    signals: '["years_in_business_established", "review_count_moderate"]',
    pitch_template:
      "Detectamos que lleva varios años operando. Tiene una base de clientes pasada que vale $50,000+ reactivable. AI Outbound Reactivator llama a cada cliente inactivo con un pitch personalizado, agenda en su calendario, y trae revenue que hoy se pierde.",
    pitch_template_en:
      "We detected you've been in business for years. You have a past customer base worth $50,000+ that can be reactivated. AI Outbound Reactivator calls each inactive customer with a personalized pitch, books into your calendar, and brings back revenue that's currently being lost.",
    category: "voice",
    sort_order: 60,
  },
  {
    id: "ai_follow_up_nurture",
    tier: 2,
    name: "AI Follow-Up & Nurture",
    name_en: "AI Follow-Up & Nurture",
    icon: "🔄",
    description:
      "Secuencia automática de 5-7 contactos por 14 días al lead que no agendó. SMS, email, llamada.",
    description_en:
      "Automatic 5-7 touch sequence over 14 days for leads that didn't book. SMS, email, call.",
    example:
      "Lead de solar. Día 1 SMS, Día 3 email, Día 7 SMS, Día 14 llamada. Convierte 3x más.",
    example_en:
      "Solar lead. Day 1 SMS, Day 3 email, Day 7 SMS, Day 14 call. Converts 3x more.",
    pain_solved:
      "80% de leads calificados se enfrían en 7 días sin seguimiento. Se van con la competencia.",
    pain_solved_en:
      "80% of qualified leads go cold in 7 days without follow-up. They go to competitors.",
    price_setup: 200,
    price_monthly: 150,
    signals: '["has_contact_form", "primary_type_high_ticket"]',
    pitch_template:
      "80% de leads se enfrían en 7 días sin seguimiento. AI Follow-Up manda 5-7 contactos personalizados por SMS/email/llamada en 14 días. Convierte 3x más sin esfuerzo manual.",
    pitch_template_en:
      "80% of leads go cold in 7 days without follow-up. AI Follow-Up sends 5-7 personalized touches via SMS/email/call over 14 days. Converts 3x more without manual effort.",
    category: "lead_capture",
    sort_order: 70,
  },
  {
    id: "ai_web_chat_24_7",
    tier: 2,
    name: "AI Web Chat 24/7",
    name_en: "AI Web Chat 24/7",
    icon: "💻",
    description:
      "Chat conversacional en el sitio que responde dudas, califica, y transfiere a humano si es complejo.",
    description_en:
      "Conversational web chat that answers questions, qualifies leads, and transfers to humans when complex.",
    example:
      "Plomería web. Visitante pregunta '¿Cuánto cuesta instalar water heater?' → IA da rango, agenda.",
    example_en:
      "Plumbing website. Visitor asks 'How much for a water heater install?' → AI gives range, books.",
    pain_solved:
      "Solo 2-3% de visitantes web convierten a lead. El resto se va sin contacto.",
    pain_solved_en:
      "Only 2-3% of web visitors convert to leads. The rest leave without contact.",
    price_setup: 300,
    price_monthly: 150,
    signals: '["has_website", "no_chat"]',
    pitch_template:
      "Solo el 2-3% de visitantes web dejan sus datos. AI Web Chat 24/7 contesta dudas, califica al visitante con 3 preguntas, y agenda. Captura 5-10x más leads sin levantar el teléfono.",
    pitch_template_en:
      "Only 2-3% of web visitors leave their info. AI Web Chat 24/7 answers questions, qualifies visitors with 3 questions, and books. Captures 5-10x more leads without picking up the phone.",
    category: "lead_capture",
    sort_order: 80,
  },

  // ===== Tier 3: Premium =====
  {
    id: "ai_dispatching_routing",
    tier: 3,
    name: "AI Dispatching & Routing",
    name_en: "AI Dispatching & Routing",
    icon: "🚚",
    description:
      "Optimiza rutas de técnicos, manda ETAs a clientes, reasigna trabajos cuando uno termina antes.",
    description_en:
      "Optimizes tech routes, sends ETAs to customers, reassigns jobs when one finishes early.",
    example:
      "HVAC. Técnico termina antes en Corona → IA lo manda a Norco, manda ETA al cliente.",
    example_en:
      "HVAC. Tech finishes early in Corona → AI routes to Norco, sends ETA to customer.",
    pain_solved:
      "Técnicos manejan 30% más de lo necesario. Clientes esperan más. Margen se va en gasolina.",
    pain_solved_en:
      "Techs drive 30% more than needed. Customers wait longer. Margin disappears in gas.",
    price_setup: 800,
    price_monthly: 400,
    signals: '["is_24_7_emergency", "employee_count_high", "location_count_multi"]',
    pitch_template:
      "Sus técnicos manejan 30% más de lo necesario. AI Dispatching optimiza rutas, manda ETAs por SMS, y reasigna trabajos cuando uno termina antes. Recupera $2,000-5,000/mes en gasolina y tiempo.",
    pitch_template_en:
      "Your techs drive 30% more than needed. AI Dispatching optimizes routes, sends ETAs via SMS, and reassigns jobs when one finishes early. Recovers $2,000-5,000/mo in gas and time.",
    category: "operations",
    sort_order: 90,
  },
  {
    id: "ai_content_social",
    tier: 3,
    name: "AI Content & Social",
    name_en: "AI Content & Social",
    icon: "📱",
    description:
      "Genera 12 posts de Instagram/mes, 2 artículos de blog, 1 update de Google. Dueño aprueba y publica.",
    description_en:
      "Generates 12 Instagram posts/mo, 2 blog articles, 1 Google update. Owner approves and publishes.",
    example:
      "Dental: 12 posts IG, 2 blogs sobre Invisalign, 1 update de Google. Listo para el mes.",
    example_en:
      "Dental: 12 IG posts, 2 Invisalign blogs, 1 Google update. Ready for the month.",
    pain_solved:
      "No tienen tiempo para marketing. Sus redes se oxidan, pierden visibilidad.",
    pain_solved_en:
      "No time for marketing. Social media goes stale, lose visibility.",
    price_setup: 300,
    price_monthly: 200,
    signals: '["has_social_low_activity", "no_blog"]',
    pitch_template:
      "Sus redes sociales se oxidan porque no tiene tiempo. AI Content & Social genera 12 posts IG, 2 blogs, 1 update de Google por mes. Usted aprueba y publica en 10 minutos total.",
    pitch_template_en:
      "Your social media goes stale because you don't have time. AI Content & Social generates 12 IG posts, 2 blogs, 1 Google update per month. You approve and publish in 10 minutes total.",
    category: "marketing",
    sort_order: 100,
  },
  {
    id: "ai_voice_confirmations",
    tier: 3,
    name: "AI Voice Confirmations",
    name_en: "AI Voice Confirmations",
    icon: "✓",
    description:
      "IA llama 24h antes para confirmar citas. Si no contesta, manda SMS. Reagenda automáticamente.",
    description_en:
      "AI calls 24h before to confirm appointments. If no answer, sends SMS. Auto-reschedules.",
    example:
      "Dentista. 50 llamadas/día confirmando citas de mañana. No-show baja de 20% a 5%.",
    example_en:
      "Dentist. 50 calls/day confirming tomorrow's appointments. No-show drops from 20% to 5%.",
    pain_solved:
      "20% de no-show cuesta $100+/slot perdido. $2,000/mes en una clínica promedio.",
    pain_solved_en:
      "20% no-show rate costs $100+/slot lost. $2,000/mo in an average clinic.",
    price_setup: 300,
    price_monthly: 250,
    signals: '["has_booking", "primary_type_dental_or_medical"]',
    pitch_template:
      "20% de sus citas son no-show. Cada slot vacío le cuesta $100+. AI Voice Confirmations llama 24h antes, manda SMS si no contesta, y reagenda automáticamente. Reduce no-show a 5%.",
    pitch_template_en:
      "20% of your appointments are no-shows. Each empty slot costs $100+. AI Voice Confirmations calls 24h before, sends SMS if no answer, auto-reschedules. Drops no-shows to 5%.",
    category: "voice",
    sort_order: 110,
  },
  {
    id: "ai_ads_optimization",
    tier: 3,
    name: "AI Ads Optimization",
    name_en: "AI Ads Optimization",
    icon: "📊",
    description:
      "Genera 20 variaciones de anuncios, A/B testea, pausa los de bajo rendimiento, rota los ganadores.",
    description_en:
      "Generates 20 ad variations, A/B tests, pauses poor performers, rotates winners.",
    example:
      "HVAC en Google Ads. IA escribe 20 ads, testea, identifica ganador, rota semanalmente.",
    example_en:
      "HVAC on Google Ads. AI writes 20 ads, tests, identifies winner, rotates weekly.",
    pain_solved:
      "CPC de $150+ con copy mediocre. La IA lo mejora 2-3x con menos presupuesto.",
    pain_solved_en:
      "$150+ CPC with mediocre copy. AI improves 2-3x with less budget.",
    price_setup: 400,
    price_monthly: 300,
    signals: '["has_active_ads", "primary_type_high_ticket"]',
    pitch_template:
      "Si está gastando $1,000+/mes en Google Ads, la IA puede reducir su CPC un 30-50%. AI Ads Optimization genera 20 variaciones, A/B testea, y rota ganadores semanalmente. ROI mejora sin más presupuesto.",
    pitch_template_en:
      "If you're spending $1,000+/mo on Google Ads, AI can reduce your CPC 30-50%. AI Ads Optimization generates 20 variations, A/B tests, rotates winners weekly. Better ROI without more budget.",
    category: "marketing",
    sort_order: 120,
  },
];

function main() {
  console.log("🌱 Seeding 12 AI services into catalog...\n");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const insert = db.prepare(`
    INSERT INTO service_catalog (
      id, tier, name, name_en, icon, description, description_en,
      example, example_en, pain_solved, pain_solved_en,
      price_setup, price_monthly, signals_json, pitch_template, pitch_template_en,
      category, active, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  const checkExisting = db.prepare(
    `SELECT id FROM service_catalog WHERE id = ?`
  );

  const update = db.prepare(`
    UPDATE service_catalog SET
      tier = ?, name = ?, name_en = ?, icon = ?,
      description = ?, description_en = ?,
      example = ?, example_en = ?,
      pain_solved = ?, pain_solved_en = ?,
      price_setup = ?, price_monthly = ?,
      signals_json = ?, pitch_template = ?, pitch_template_en = ?,
      category = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `);

  const now = Math.floor(Date.now() / 1000);

  for (const svc of SERVICES) {
    const exists = checkExisting.get(svc.id);
    if (exists) {
      update.run(
        svc.tier, svc.name, svc.name_en, svc.icon,
        svc.description, svc.description_en,
        svc.example, svc.example_en,
        svc.pain_solved, svc.pain_solved_en,
        svc.price_setup, svc.price_monthly,
        svc.signals, svc.pitch_template, svc.pitch_template_en,
        svc.category, svc.sort_order, now,
        svc.id
      );
      updated++;
    } else {
      insert.run(
        svc.id, svc.tier, svc.name, svc.name_en, svc.icon,
        svc.description, svc.description_en,
        svc.example, svc.example_en,
        svc.pain_solved, svc.pain_solved_en,
        svc.price_setup, svc.price_monthly,
        svc.signals, svc.pitch_template, svc.pitch_template_en,
        svc.category, svc.sort_order, now, now
      );
      created++;
    }
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM service_catalog`).get() as { c: number };
  console.log(`📊 Resumen: ${created} creados, ${updated} actualizados, ${total.c} en total\n`);

  // List by tier
  const tiers = [1, 2, 3];
  for (const tier of tiers) {
    const list = db.prepare(
      `SELECT name, price_setup, price_monthly FROM service_catalog WHERE tier = ? ORDER BY sort_order`
    ).all(tier) as any[];
    console.log(`\n  Tier ${tier} (${list.length} servicios):`);
    list.forEach((s) => {
      console.log(`    ${s.name.padEnd(28)} $${s.price_setup} + $${s.price_monthly}/mo`);
    });
  }
  return { created, updated };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed-services.ts")) {
  main();
}

export { main as seedServices };
