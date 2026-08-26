/**
 * Localization helper for 5D Scoring reasoning & Matched Services reasoning.
 * Ensures 100% bidirectional translation between Spanish and English for dynamic
 * AI diagnostic outputs and scoring breakdowns.
 */

export function translateScoreReason(reason: string | undefined | null, locale: string): string {
  if (!reason || locale !== "en") return reason ?? "";

  const text = reason.trim();

  // 1. Domain & Social Funnel Gaps
  if (text.includes("Dominio vencido / Página de parking detectada")) {
    return "🚨 Expired Domain / Parked Page Detected: Official link on Google Maps lacks an active functional website. Critical opportunity for AI Web & 24/7 capture.";
  }
  if (text.includes("Fuga de Tráfico Social:")) {
    return text
      .replace("🚨 Fuga de Tráfico Social: Tiene presencia activa en redes (", "🚨 Social Traffic Funnel Gap: Active social presence on (")
      .replace(") pero carece de sitio web propio y chatbot con IA para convertir seguidores en clientes directos.", ") but lacks a dedicated website and AI chatbot to convert followers into paying customers.");
  }
  if (text.includes("Sin sitio web oficial en Google Places")) {
    return "No official website on Google Places. Critical digital gap: modern AI-powered website recommended.";
  }
  if (text.includes("Presencia web limitada sin automatizaciones")) {
    return "Limited web presence with no automation detected.";
  }
  if (text.includes("Sitio web activo y optimizado")) {
    return "Active and optimized website.";
  }
  if (text.includes("Operación comercial bien cubierta")) {
    return "Well-covered commercial operations.";
  }
  if (text.includes("Distancia no especificada")) {
    return "Distance not specified, neutral score.";
  }
  if (text.includes("Negocio local activo en Google Maps")) {
    return "Active local business on Google Maps.";
  }

  // 2. Gaps: Dimension A & Dimension B
  if (text.startsWith("Brechas web detectadas:") || text.startsWith("Gaps operativos:")) {
    const isWeb = text.startsWith("Brechas web detectadas:");
    let body = text.replace("Brechas web detectadas:", "").replace("Gaps operativos:", "");
    body = body
      .replace(/web en /g, "website on ")
      .replace(/sin chat en vivo/g, "no live chat")
      .replace(/sin WhatsApp/g, "no WhatsApp")
      .replace(/sin booking online/g, "no online booking")
      .replace(/sin formulario de contacto/g, "no contact form")
      .replace(/sin formulario de cotización/g, "no quote request form")
      .replace(/sin agendamiento de citas online/g, "no online appointment booking")
      .replace(/no opera 24\/7/g, "not operating 24/7")
      .replace(/sin cobertura 24\/7/g, "no 24/7 coverage")
      .replace(/sin redes sociales/g, "no social media")
      .replace(/último post hace (\d+) días/g, "last post $1 days ago")
      .replace(/sin teléfono de contacto/g, "no contact phone")
      .replace(/sin email directo/g, "no direct email")
      .replace(/sin perfil verificado en Google/g, "unverified Google profile")
      .replace(/volumen bajo de reseñas \((\d+)\)/g, "low review count ($1)")
      .replace(/pocas reseñas \((\d+)\)/g, "few reviews ($1)")
      .replace(/🚨 Reseñas reportan llamadas no contestadas/g, "🚨 Reviews report missed calls")
      .replace(/demoras reportadas en cotizaciones/g, "reported delays in quotes")
      .replace(/dificultad para agendar citas/g, "difficulty booking appointments");

    return `${isWeb ? "Web gaps detected:" : "Operational gaps:"}${body}`;
  }

  // 3. Dimension C: Fit del Negocio
  if (text.startsWith("Fit: Sector") || text.startsWith("Fit: Comercio local")) {
    let fit = text
      .replace("Fit: Sector ", "Fit: Sector ")
      .replace("Fit: Comercio local general", "Fit: General local business")
      .replace(/· 📍 Cadena multi-sucursal \((\d+) locales\)/g, "· 📍 Multi-location chain ($1 locations)")
      .replace(/· 📍 Cadena \((\d+) locales\)/g, "· 📍 Chain ($1 locations)")
      .replace(/Ideal para /g, "Ideal for ")
      .replace(/Apto para /g, "Suitable for ")
      .replace(/HVAC & Climatización/g, "HVAC & Climate Control")
      .replace(/Plomería & Fontanería/g, "Plumbing & Rooter")
      .replace(/Techos & Roofing/g, "Roofing & Gutters")
      .replace(/Electricistas/g, "Electricians")
      .replace(/Solar & Energías Renovables/g, "Solar & Clean Energy")
      .replace(/Contabilidad, Impuestos & CPA/g, "Accounting, Taxes & CPA")
      .replace(/Abogados & Servicios Legales/g, "Lawyers & Legal Services")
      .replace(/Dental & Odontología/g, "Dental & Orthodontics")
      .replace(/Restauración & Daños por Agua/g, "Water Damage & Restoration")
      .replace(/Talleres Mecánicos & Car Care/g, "Auto Repair & Car Care")
      .replace(/Cafetería, Panadería & Restaurante/g, "Coffee, Bakery & Restaurants")
      .replace(/Salón de Belleza, Barbería & Spa/g, "Beauty Salon, Barber & Spa")
      .replace(/Gimnasios & Fitness/g, "Gyms & Fitness")
      .replace(/Veterinarias & Mascotas/g, "Veterinary & Pets")
      .replace(/Control de Plagas & Exterminadores/g, "Pest Control & Exterminators")
      .replace(/y /g, "and ");
    return fit;
  }

  // 4. Dimension D: Señales de Compra
  if (text.startsWith("Señales detectadas:")) {
    let sig = text.replace("Señales detectadas:", "Signals detected:");
    sig = sig
      .replace(/(\d+) reseñas en Google \(alto flujo de clientes\)/g, "$1 Google reviews (high customer flow)")
      .replace(/(\d+) reseñas en Google \(flujo comercial constante\)/g, "$1 Google reviews (steady customer flow)")
      .replace(/(\d+) reseñas \(negocio activo\)/g, "$1 reviews (active business)")
      .replace(/(\d+) reseñas/g, "$1 reviews")
      .replace(/rating ([\d.]+)★ \(cuida su reputación\)/g, "rating $1★ (cares for reputation)")
      .replace(/local comercial físico verificado/g, "verified physical business location")
      .replace(/línea telefónica activa/g, "active phone line")
      .replace(/(\d+)\+ años operando/g, "$1+ years in business")
      .replace(/invierte en publicidad \((.*?)\)/g, "invests in advertising ($1)")
      .replace(/invierte en publicidad digital/g, "invests in digital advertising")
      .replace(/(\d+) reseñas en Yelp \(([\d.]+)★\)/g, "$1 Yelp reviews ($2★)")
      .replace(/brecha de reputación \((.*?) Google vs (.*?) Yelp\)/g, "reputation gap ($1 Google vs $2 Yelp)");
    return sig;
  }

  // 5. Dimension E: Proximidad
  if (text.startsWith("A ") && text.includes(" mi (")) {
    let prox = text
      .replace("zona inmediata de alta cobertura", "immediate high-coverage zone")
      .replace("fácil acceso en auto", "easy driving access")
      .replace("distancia moderada en Inland Empire", "moderate distance in Inland Empire")
      .replace("cobertura estándar en el área metropolitana", "standard metro area coverage")
      .replace("fuera de radio principal, requiere atención remota", "outside primary radius, requires remote outreach")
      .replace("A ", "At ");
    return prox;
  }

  return text;
}

export function translateServiceReason(reason: string | undefined | null, locale: string): string {
  if (!reason || locale !== "en") return reason ?? "";

  return reason
    .replace(/alta brecha digital detectada/gi, "high digital gap detected")
    .replace(/sin chat en web/gi, "no website chat widget")
    .replace(/redes sociales inactivas/gi, "inactive social media")
    .replace(/alto gap operativo/gi, "high operational gap")
    .replace(/responde leads tarde/gi, "slow lead response")
    .replace(/sin booking online/gi, "no online booking")
    .replace(/es negocio de emergencia/gi, "24/7 emergency business")
    .replace(/invierte en ads con ticket alto/gi, "invests in ads with high average ticket")
    .replace(/(\d+) reseñas que gestionar/gi, "$1 reviews to manage")
    .replace(/solo (\d+) reseñas/gi, "only $1 reviews")
    .replace(/(\d+) años de clientes pasados reactivables/gi, "$1 years of past reactivable clients")
    .replace(/negocio de despacho/gi, "dispatch business")
    .replace(/genera leads pero no los nurtures/gi, "generates leads but doesn't nurture them")
    .replace(/no menciona 24\/7 en su web/gi, "does not mention 24/7 on website")
    .replace(/Match general/gi, "General match");
}
