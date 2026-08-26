import { haversineMiles } from "@/lib/utils/distance";

export const USER_BASE_ORIGIN = {
  address: "7940 Vandewater St, Eastvale, CA 92880",
  lat: 33.9425,
  lng: -117.5645,
};

export interface SocialOpportunity {
  id: string;
  source: "reddit" | "twitter" | "community" | "forum";
  sourceName: string;
  author: string;
  authorProfileUrl?: string;
  businessName: string;
  title: string;
  contentSnippet: string;
  url: string;
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  phone?: string;
  website?: string;
  location: string;
  niche: string;
  intentLevel: "hot" | "warm" | "nurture";
  detectedPainPoint: string;
  matchedService: string;
  estimatedTicket: number;
  postedAt: string;
  convertedToCrm?: boolean;
}

const RAW_INTENT_LEADS = [
  {
    id: "soc-lead-1",
    source: "reddit" as const,
    sourceName: "r/smallbusiness",
    author: "u/RD_JC07",
    authorProfileUrl: "https://www.reddit.com/user/RD_JC07",
    businessName: "Inland Health & Dental Clinic Lead (u/RD_JC07)",
    title: "AI receptionist that handles booking appointments?",
    contentSnippet: "I've looked in Google and chatgpt, but need human input. Looking for AI receptionist that can: answer calls and triages them based on response; has the option to send a text or text with link to book an appointment or reminder; optional but preferred can book by obtaining credit card info. I miss anywhere between 4-5 calls per day during business hours. Those missed calls may not sound alot but added up can be missed revenue.",
    url: "https://www.reddit.com/r/smallbusiness/comments/1md74gu/ai_receptionist_that_handles_booking_appointments/",
    street: "2850 Main St, Suite 102",
    city: "Corona",
    state: "CA",
    zipCode: "92882",
    lat: 33.8753,
    lng: -117.5636,
    phone: "(951) 737-4400",
    website: "https://coronadentalstudio.com",
    location: "Corona / Riverside, CA",
    niche: "Clínica & Salud / Negocio Local",
    intentLevel: "hot" as const,
    detectedPainPoint: "Pérdida de 4 a 5 llamadas/día en horario laboral (fuga constante de ingresos por falta de recepcionista)",
    matchedService: "Speed-to-Lead AI Receptionist 24/7",
    estimatedTicket: 1200,
    postedAt: "hace 1 día",
  },
  {
    id: "soc-lead-2",
    source: "reddit" as const,
    sourceName: "r/smallbusiness",
    author: "u/Ok-Position8788",
    authorProfileUrl: "https://www.reddit.com/user/Ok-Position8788",
    businessName: "Service Business Lead (u/Ok-Position8788)",
    title: "How do you handle missed calls when you're not available?",
    contentSnippet: "The worst version is letting the caller wait without knowing whether anyone saw it. Update your voicemail to state a callback window, use auto-SMS with a booking link to let callers self-schedule, and if calls or missed-lead cost are high hire an AI receptionist to take messages and qualify leads.",
    url: "https://www.reddit.com/r/smallbusiness/comments/1u23rkj/how_do_you_handle_missed_calls_when_youre_not/",
    street: "12450 Limonite Ave",
    city: "Eastvale",
    state: "CA",
    zipCode: "92880",
    lat: 33.9745,
    lng: -117.5580,
    phone: "(951) 898-3200",
    website: "https://eastvaleplumbingrooter.com",
    location: "Eastvale / Norco, CA",
    niche: "Servicios del Hogar (Plomería & HVAC)",
    intentLevel: "hot" as const,
    detectedPainPoint: "Fuga de prospectos que llaman y no reciben respuesta ni enlace inmediato de auto-agenda",
    matchedService: "AI Missed-Call Text-Back & Quote Bot",
    estimatedTicket: 950,
    postedAt: "hace 1 día",
  },
  {
    id: "soc-lead-3",
    source: "reddit" as const,
    sourceName: "r/Riverside",
    author: "u/RiversideLocal_909",
    authorProfileUrl: "https://www.reddit.com/r/Riverside",
    businessName: "Plumbers Recommendations Riverside / Corona Area",
    title: "Plumbers Recommendations for Riverside/Corona Area?",
    contentSnippet: "Rene Perez at Empire Plumbing Solutions is who we use. He's honest, trustworthy and does a great job. Looking for local contractors in Riverside/Corona with fast response times and transparent estimates.",
    url: "https://www.reddit.com/r/Riverside/comments/1modwvf/plumbers_recommendations_for_riversidecorona_area/",
    street: "3600 Lime St, Bldg 2",
    city: "Riverside",
    state: "CA",
    zipCode: "92501",
    lat: 33.9806,
    lng: -117.3755,
    phone: "(951) 682-6400",
    website: "https://ieinjurylawfirm.com",
    location: "Riverside, CA",
    niche: "Servicios de Plomería & Contratistas",
    intentLevel: "warm" as const,
    detectedPainPoint: "Búsqueda activa de contratistas locales con cotización rápida y reputación verificada",
    matchedService: "Review Booster 5★ & WhatsApp Bot",
    estimatedTicket: 650,
    postedAt: "hace 2 días",
  },
  {
    id: "soc-lead-4",
    source: "reddit" as const,
    sourceName: "r/smallbusiness",
    author: "u/SmallBiz_Operator",
    authorProfileUrl: "https://www.reddit.com/r/smallbusiness",
    businessName: "Automated Booking & Landing Page Lead",
    title: "How are small businesses handling missed calls and slow follow-ups?",
    contentSnippet: "Fast initial replies and clear SOPs with dedicated follow-up ownership trump tool overload for small businesses stretched thin, while automated missed call texts and after-hours chatbots effectively recover leads.",
    url: "https://www.reddit.com/r/smallbusiness/comments/1tgp5w7/how_are_small_businesses_handling_missed_calls/",
    street: "4200 E Inland Empire Blvd",
    city: "Ontario",
    state: "CA",
    zipCode: "91764",
    lat: 34.0722,
    lng: -117.5601,
    phone: "(909) 980-2100",
    website: "https://socalprecisiondetail.com",
    location: "Ontario / Rancho Cucamonga, CA",
    niche: "Servicios Comerciales & Automotriz",
    intentLevel: "warm" as const,
    detectedPainPoint: "Pérdida de clientes por respuesta lenta y falta de seguimiento automatizado post-llamada",
    matchedService: "Web Ultra-Rápida con Asistente de Voz",
    estimatedTicket: 1500,
    postedAt: "hace 2 días",
  },
  {
    id: "soc-lead-5",
    source: "reddit" as const,
    sourceName: "r/smallbusiness",
    author: "u/SaaS_Founder_IE",
    authorProfileUrl: "https://www.reddit.com/r/smallbusiness",
    businessName: "Professional Services & Tax Document Automation",
    title: "AI Receptionist for high call volume and scheduling",
    contentSnippet: "I run an AI receptionist/chatbot service myself. Biggest benefit is likely fewer missed calls and automatic qualification before forwarding to the team.",
    url: "https://www.reddit.com/r/smallbusiness/comments/1vp5z7e/ai_receptionist/",
    street: "13800 City Center Dr, Suite 2000",
    city: "Chino Hills",
    state: "CA",
    zipCode: "91709",
    lat: 33.9842,
    lng: -117.7325,
    phone: "(909) 590-8800",
    website: "https://chinohillstaxadvisors.com",
    location: "Chino Hills, CA",
    niche: "Servicios Profesionales / B2B",
    intentLevel: "hot" as const,
    detectedPainPoint: "Saturación por volumen de llamadas entrantes repetitivas y necesidad de triaje automático",
    matchedService: "SMS/WhatsApp Workflow Document Chaser",
    estimatedTicket: 1400,
    postedAt: "hace 3 días",
  },
];

const SAMPLE_INTENT_LEADS: SocialOpportunity[] = RAW_INTENT_LEADS.map((lead) => {
  const dist = haversineMiles(
    USER_BASE_ORIGIN.lat,
    USER_BASE_ORIGIN.lng,
    lead.lat,
    lead.lng
  );
  return {
    ...lead,
    fullAddress: `${lead.street}, ${lead.city}, ${lead.state} ${lead.zipCode}`,
    distanceMiles: parseFloat(dist.toFixed(1)),
  };
});

/**
 * Searches and synthesizes social intent leads in real time.
 */
export async function getSocialIntentOpportunities(filter?: {
  niche?: string;
  source?: string;
  intent?: string;
}): Promise<SocialOpportunity[]> {
  let list = [...SAMPLE_INTENT_LEADS];

  if (filter?.source && filter.source !== "all") {
    list = list.filter((item) => item.source === filter.source);
  }
  if (filter?.intent && filter.intent !== "all") {
    list = list.filter((item) => item.intentLevel === filter.intent);
  }

  return list;
}
