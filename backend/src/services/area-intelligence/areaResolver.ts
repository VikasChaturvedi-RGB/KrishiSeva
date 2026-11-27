/**
 * Shared area resolver for the Crop-Variety Advisor and Soil Atlas.
 * Normalises the many ways a farmer (or the India Post pincode API) names a
 * state — "MP", "म.प्र.", "madhya pradesh", "Madhya Pradesh " — to one key.
 */

const STATE_ALIASES: Record<string, string> = {
  'MP': 'Madhya Pradesh', 'M.P.': 'Madhya Pradesh', 'MADHYA PRADESH': 'Madhya Pradesh', 'मध्य प्रदेश': 'Madhya Pradesh', 'म.प्र.': 'Madhya Pradesh', 'मप्र': 'Madhya Pradesh',
  'MH': 'Maharashtra', 'MAHARASHTRA': 'Maharashtra', 'महाराष्ट्र': 'Maharashtra',
  'PB': 'Punjab', 'PUNJAB': 'Punjab', 'पंजाब': 'Punjab', 'ਪੰਜਾਬ': 'Punjab',
  'HR': 'Haryana', 'HARYANA': 'Haryana', 'हरियाणा': 'Haryana',
  'UP': 'Uttar Pradesh', 'U.P.': 'Uttar Pradesh', 'UTTAR PRADESH': 'Uttar Pradesh', 'उत्तर प्रदेश': 'Uttar Pradesh', 'उ.प्र.': 'Uttar Pradesh',
  'RJ': 'Rajasthan', 'RAJASTHAN': 'Rajasthan', 'राजस्थान': 'Rajasthan',
  'GJ': 'Gujarat', 'GUJARAT': 'Gujarat', 'गुजरात': 'Gujarat', 'ગુજરાત': 'Gujarat',
  'BR': 'Bihar', 'BIHAR': 'Bihar', 'बिहार': 'Bihar',
  'WB': 'West Bengal', 'WEST BENGAL': 'West Bengal', 'पश्चिम बंगाल': 'West Bengal', 'পশ্চিমবঙ্গ': 'West Bengal',
  'OD': 'Odisha', 'OR': 'Odisha', 'ODISHA': 'Odisha', 'ORISSA': 'Odisha', 'ओडिशा': 'Odisha', 'ଓଡ଼ିଶା': 'Odisha',
  'CG': 'Chhattisgarh', 'CT': 'Chhattisgarh', 'CHHATTISGARH': 'Chhattisgarh', 'छत्तीसगढ़': 'Chhattisgarh',
  'JH': 'Jharkhand', 'JHARKHAND': 'Jharkhand', 'झारखंड': 'Jharkhand',
  'KA': 'Karnataka', 'KARNATAKA': 'Karnataka', 'कर्नाटक': 'Karnataka', 'ಕರ್ನಾಟಕ': 'Karnataka',
  'TS': 'Telangana', 'TG': 'Telangana', 'TELANGANA': 'Telangana', 'तेलंगाना': 'Telangana', 'తెలంగాణ': 'Telangana',
  'AP': 'Andhra Pradesh', 'ANDHRA PRADESH': 'Andhra Pradesh', 'आंध्र प्रदेश': 'Andhra Pradesh', 'ఆంధ్ర ప్రదేశ్': 'Andhra Pradesh',
  'TN': 'Tamil Nadu', 'TAMIL NADU': 'Tamil Nadu', 'TAMILNADU': 'Tamil Nadu', 'तमिलनाडु': 'Tamil Nadu', 'தமிழ்நாடு': 'Tamil Nadu',
  'AS': 'Assam', 'ASSAM': 'Assam', 'असम': 'Assam', 'অসম': 'Assam'
};

export function normaliseStateName(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');
  if (STATE_ALIASES[upper]) return STATE_ALIASES[upper];
  if (STATE_ALIASES[trimmed]) return STATE_ALIASES[trimmed];
  // Title-case fallback ("tamil nadu" -> "Tamil Nadu")
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Case/whitespace-insensitive key lookup ("purba bardhaman" matches "Purba Bardhaman"). */
export function findKeyInsensitive<T>(obj: Record<string, T>, wanted?: string | null): string | null {
  if (!wanted) return null;
  const w = String(wanted).trim().toLowerCase().replace(/\s+/g, ' ');
  if (!w) return null;
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === w) return k;
  }
  // Allow partial match for India Post district names like "Dhar (M.P.)" or "Lakhimpur-Kheri"
  const loose = w.replace(/[^a-zऀ-෿]/g, '');
  for (const k of Object.keys(obj)) {
    const kl = k.toLowerCase().replace(/[^a-zऀ-෿]/g, '');
    if (kl && (loose.startsWith(kl) || kl.startsWith(loose))) return k;
  }
  return null;
}

/** Calendar month (1–12) in Indian Standard Time, so a UTC server flips months at IST midnight. */
export function istMonth(now: Date = new Date()): number {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 5.5 * 3600000);
  return ist.getMonth() + 1;
}

export interface DataFreshness {
  dataVersion: string;
  lastReviewedAt: string;
  ageDays: number;
  nextRefreshDueOn: string;
  isStale: boolean;
  refreshCadence: string;
}

/** A monthly dataset is "stale" once it misses its refresh by more than 5 days. */
export function computeFreshness(version: string, lastReviewedAt: string, now: Date = new Date()): DataFreshness {
  const reviewed = new Date(`${lastReviewedAt}T00:00:00+05:30`);
  const ageDays = Math.max(0, Math.floor((now.getTime() - reviewed.getTime()) / 86400000));
  const nextDue = new Date(Date.UTC(reviewed.getUTCFullYear(), reviewed.getUTCMonth() + 1, 1));
  const graceMs = 5 * 86400000;
  return {
    dataVersion: version,
    lastReviewedAt,
    ageDays,
    nextRefreshDueOn: nextDue.toISOString().slice(0, 10),
    isStale: now.getTime() > nextDue.getTime() + graceMs,
    refreshCadence: 'MONTHLY'
  };
}
