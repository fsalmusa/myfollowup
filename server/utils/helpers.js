/**
 * Shared utility helpers — date formatting & Malaysian phone normalisation.
 */

/**
 * Normalise a Malaysian phone number to international format WITHOUT '+' or spaces.
 * 0123456789  -> 60123456789
 * 60123456789 -> 60123456789
 * +60123456789-> 60123456789
 * Returns '' for empty/invalid input.
 */
export function normalizeMyPhone(raw) {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(/\D/g, ''); // keep digits only
  if (!s) return '';
  if (s.startsWith('60')) {
    s = s.slice(2);
  } else if (s.startsWith('0')) {
    s = s.slice(1);
  }
  // Now s is the local number without leading 0 or 60 prefix.
  // Malaysian mobile/landline local numbers are 8-10 digits.
  if (s.length < 7) return s; // too short to be valid — return as-is (digits only)
  return '60' + s;
}

/** Format a normalised phone back to a friendly display: 60123456789 -> 012-345 6789 */
export function formatMyPhoneDisplay(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('60') && digits.length >= 10) {
    const local = digits.slice(2); // e.g. 123456789
    return `0${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
  }
  if (digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

/** Build a wa.me link for a Malaysian number. Returns '' if no valid number. */
export function whatsappLink(rawPhone, text = '') {
  const n = normalizeMyPhone(rawPhone);
  if (!n || n.length < 9) return '';
  const base = `https://wa.me/${n}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Convert ISO date string (YYYY-MM-DD) to display DD/MM/YYYY. Returns '' if empty. */
export function isoToDisplay(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Parse an ISO date string to a local Date at midnight. */
export function parseDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Today (local) as ISO YYYY-MM-DD. */
export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Compute subscription status from expiry date.
 * EXPIRED        -> expiry date in the past
 * EXPIRING_SOON  -> expiry date within the next 7 days (inclusive)
 * ACTIVE         -> otherwise (future beyond 7 days, or no expiry date)
 */
export function subscriptionStatus(expiryISO) {
  const exp = parseDate(expiryISO);
  if (!exp) return 'ACTIVE'; // no expiry => treat as active
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

/**
 * Enrich a raw customer row with computed display fields
 * (subscription status, phone display, WhatsApp link, formatted dates).
 */
export function enrichCustomer(row) {
  if (!row) return row;
  const sub = subscriptionStatus(row.expiry_date);
  return {
    ...row,
    subscription_status: sub,
    subscription_label: SUBSCRIPTION_LABELS[sub],
    phone_display: formatMyPhoneDisplay(row.phone),
    whatsapp_link: whatsappLink(row.phone),
    subscribe_date_display: isoToDisplay(row.subscribe_date),
    expiry_date_display: isoToDisplay(row.expiry_date),
  };
}
