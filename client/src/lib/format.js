/**
 * Client-side formatting + derived-status helpers (mirrors server logic).
 */

export function normalizeMyPhone(raw) {
  if (raw == null) return '';
  let s = String(raw).replace(/\D/g, '');
  if (!s) return '';
  if (s.startsWith('60')) s = s.slice(2);
  else if (s.startsWith('0')) s = s.slice(1);
  if (s.length < 7) return s;
  return '60' + s;
}

export function whatsappLink(rawPhone, text = '') {
  const n = normalizeMyPhone(rawPhone);
  if (!n || n.length < 9) return '';
  const base = `https://wa.me/${n}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Detect contact type & return the right link.
 *  - Number (0123..., 6012...) => WhatsApp wa.me link
 *  - Username (@xxx / t.me/xxx / xxx) => Telegram t.me link
 *  - ig:xxx or instagram.com/xxx => Instagram link
 * Returns '' if nothing usable.
 */
export function contactLink(raw, text = '') {
  const s = String(raw || '').trim();
  if (!s) return '';
  // Instagram explicit
  if (/^ig:/i.test(s)) {
    return `https://instagram.com/${s.replace(/^ig:/i, '').replace(/^@/, '')}`;
  }
  // Pure number (with optional + / spaces / dashes) => WhatsApp
  if (/^[+]?[\d\s-]{7,}$/.test(s)) {
    return whatsappLink(s, text);
  }
  // Telegram username
  const u = s.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').replace(/^t\.me\//, '');
  if (u) return `https://t.me/${u}`;
  return '';
}

/** Return a short label describing the contact platform. */
export function contactType(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^ig:/i.test(s)) return 'Instagram';
  if (/^[+]?[\d\s-]{7,}$/.test(s)) return 'WhatsApp';
  return 'Telegram';
}

export function formatPhoneDisplay(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('60') && digits.length >= 10) {
    const local = digits.slice(2);
    return `0${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
  }
  if (digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

export function isoToDisplay(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function displayToISO(dmy) {
  const m = String(dmy || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

export function parseDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function subscriptionStatus(expiryISO) {
  const exp = parseDate(expiryISO);
  if (!exp) return 'ACTIVE';
  const today = parseDate(todayISO());
  const DAY = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((exp - today) / DAY);
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

export const SUBSCRIPTION_LABELS = {
  ACTIVE: 'Masih Aktif',
  EXPIRING_SOON: 'Akan Expired',
  EXPIRED: 'Expired',
};

/** Format an ISO datetime (from SQLite 'YYYY-MM-DD HH:MM:SS') into 'DD/MM/YYYY HH:MM'. */
export function formatDateTime(dt) {
  if (!dt) return '';
  const m = String(dt).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return isoToDisplay(dt);
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}

export const MONTHS_MS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];
