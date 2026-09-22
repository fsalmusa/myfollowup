/**
 * API client over Supabase (PostgREST).
 * Same method signatures as the old REST client, so pages don't change.
 *
 * NOTE ON IDS: Supabase uses bigint ids. The frontend passes numeric strings
 * around; PostgREST accepts them fine. We convert to Number where needed.
 */

import { supabase } from './supabaseClient.js';

/** Normalise a Supabase row -> keep snake_case fields as-is. */
const pass = (r) => r;

/** Turn a Supabase error into a thrown Error with a friendly message. */
function throwIf(error) {
  if (error) throw new Error(error.message || 'Ralat: permintaan gagal.');
}

export const api = {
  // ------------------------------------------------------------------ //
  // Stats                                                               //
  // ------------------------------------------------------------------ //
  async stats() {
    const [{ count: total_groups }, { count: total_customers }] = await Promise.all([
      supabase.from('groups').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
    ]);
    const { data: followed, error: e1 } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('follow_up_status', 'COMPLETED');
    throwIf(e1);
    const followed_up = followed?.count ?? 0;
    const not_followed_up = (total_customers ?? 0) - followed_up;
    return { total_groups: total_groups ?? 0, total_customers: total_customers ?? 0, followed_up, not_followed_up };
  },

  // ------------------------------------------------------------------ //
  // Groups                                                              //
  // ------------------------------------------------------------------ //
  async listGroups(search = '') {
    let q = supabase.from('groups').select('*').order('name', { ascending: true });
    if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error } = await q;
    throwIf(error);
    return (data || []).map(pass);
  },

  async getGroup(id) {
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
    if (error) throw new Error('Group tidak dijumpai.');
    return pass(data);
  },

  async createGroup(payload) {
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: payload.name, description: payload.description || '' })
      .select()
      .single();
    throwIf(error);
    return pass(data);
  },

  async updateGroup(id, payload) {
    const { data, error } = await supabase
      .from('groups')
      .update({ name: payload.name, description: payload.description })
      .eq('id', id)
      .select()
      .single();
    throwIf(error);
    return pass(data);
  },

  async deleteGroup(id) {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    throwIf(error);
    return { deleted: true };
  },

  async groupCustomers(id, { search = '', status = '' } = {}) {
    let q = supabase.from('customers').select('*, groups!inner(name)').eq('group_id', id);
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email_subscribe.ilike.%${search}%,email_family.ilike.%${search}%`);
    if (status === 'PENDING' || status === 'COMPLETED') q = q.eq('follow_up_status', status);
    const { data, error } = await q;
    throwIf(error);
    // flatten group_name + sort pending-first
    const rows = (data || []).map((c) => ({ ...c, group_name: c.groups?.name || '' }));
    rows.sort((a, b) =>
      a.follow_up_status === b.follow_up_status
        ? a.name.localeCompare(b.name, 'ms')
        : a.follow_up_status === 'PENDING'
          ? -1
          : 1
    );
    return rows;
  },

  // ------------------------------------------------------------------ //
  // Customers                                                           //
  // ------------------------------------------------------------------ //
  async listCustomers(params = {}) {
    const { search = '', group_id = '', follow_up_status = '', subscription_status = '', sort = 'name', page = 1, limit = 50 } = params;
    let q = supabase.from('customers').select('*, groups!inner(name)', { count: 'exact' });

    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email_subscribe.ilike.%${search}%,email_family.ilike.%${search}%`);
    if (group_id) q = q.eq('group_id', Number(group_id));
    if (follow_up_status === 'PENDING' || follow_up_status === 'COMPLETED') q = q.eq('follow_up_status', follow_up_status);

    const { data, error, count } = await q;
    throwIf(error);

    let rows = (data || []).map((c) => ({ ...c, group_name: c.groups?.name || '' }));

    // subscription_status is derived client-side (mirrors old logic)
    if (subscription_status === 'ACTIVE' || subscription_status === 'EXPIRING_SOON' || subscription_status === 'EXPIRED') {
      rows = rows.filter((r) => subscriptionStatus(r.expiry_date) === subscription_status);
    }

    // sort
    const sorters = {
      name: (a, b) => a.name.localeCompare(b.name, 'ms'),
      subscribe_date: (a, b) => (a.subscribe_date || '').localeCompare(b.subscribe_date || ''),
      expiry_date: (a, b) => (a.expiry_date || '').localeCompare(b.expiry_date || ''),
      follow_up_status: (a, b) =>
        a.follow_up_status === b.follow_up_status
          ? a.name.localeCompare(b.name, 'ms')
          : a.follow_up_status === 'PENDING'
            ? -1
            : 1,
    };
    const baseSorter = (a, b) =>
      a.follow_up_status === b.follow_up_status
        ? a.name.localeCompare(b.name, 'ms')
        : a.follow_up_status === 'PENDING'
          ? -1
          : 1;
    rows.sort(sorters[sort] || baseSorter);

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const dataOut = rows.slice(start, start + limit);

    return { data: dataOut, total, page, limit, total_pages: totalPages };
  },

  async getCustomer(id) {
    const { data, error } = await supabase.from('customers').select('*, groups!inner(name)').eq('id', id).single();
    if (error) throw new Error('Customer tidak dijumpai.');
    const { data: history, error: e2 } = await supabase
      .from('follow_up_history')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    throwIf(e2);
    return { ...data, group_name: data.groups?.name || '', history: history || [] };
  },

  async createCustomer(payload) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        group_id: Number(payload.group_id),
        name: payload.name,
        phone: (payload.phone || '').replace(/\s+/g, ''),
        email_subscribe: payload.email_subscribe || '',
        email_family: payload.email_family || '',
        subscribe_date: payload.subscribe_date || '',
        expiry_date: payload.expiry_date || '',
      })
      .select('*, groups!inner(name)')
      .single();
    throwIf(error);
    return { ...data, group_name: data.groups?.name || '' };
  },

  async updateCustomer(id, payload) {
    const patch = {};
    if (payload.name !== undefined) patch.name = payload.name;
    if (payload.group_id !== undefined && payload.group_id !== null && payload.group_id !== '') patch.group_id = Number(payload.group_id);
    if (payload.phone !== undefined) patch.phone = String(payload.phone).replace(/\s+/g, '');
    if (payload.email_subscribe !== undefined) patch.email_subscribe = payload.email_subscribe;
    if (payload.email_family !== undefined) patch.email_family = payload.email_family;
    if (payload.subscribe_date !== undefined) patch.subscribe_date = payload.subscribe_date;
    if (payload.expiry_date !== undefined) patch.expiry_date = payload.expiry_date;

    const { data, error } = await supabase.from('customers').update(patch).eq('id', id).select('*, groups!inner(name)').single();
    throwIf(error);
    return { ...data, group_name: data.groups?.name || '' };
  },

  async deleteCustomer(id) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    throwIf(error);
    return { deleted: true };
  },

  async toggleFollowUp(id, status, note) {
    // determine target
    const { data: existing, error: e0 } = await supabase.from('customers').select('follow_up_status').eq('id', id).single();
    if (e0) throw new Error('Customer tidak dijumpai.');
    let target = String(status || '').toUpperCase();
    if (target !== 'COMPLETED' && target !== 'PENDING') {
      target = existing.follow_up_status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    }

    const now = new Date().toISOString();
    let updatePayload;
    let historyPayload;
    if (target === 'COMPLETED') {
      updatePayload = { follow_up_status: 'COMPLETED', last_follow_up_at: now };
      historyPayload = { customer_id: Number(id), action: 'FOLLOW_UP', note: note || '' };
    } else {
      updatePayload = { follow_up_status: 'PENDING', last_follow_up_at: null };
      historyPayload = { customer_id: Number(id), action: 'UNFOLLOW_UP', note: note || 'Ditanda semula sebagai belum follow up' };
    }

    const { data: customer, error: e1 } = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', id)
      .select('*, groups!inner(name)')
      .single();
    throwIf(e1);
    const { error: e2 } = await supabase.from('follow_up_history').insert(historyPayload);
    throwIf(e2);

    // Recompute group stats (mirrors the old shapeGroup).
    const group = await shapeGroup(customer.group_id);
    return { customer: { ...customer, group_name: customer.groups?.name || '' }, group };
  },

  async getHistory(id) {
    const { data, error } = await supabase
      .from('follow_up_history')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    throwIf(error);
    return data || [];
  },

  async addHistoryNote(id, note) {
    const { data, error } = await supabase
      .from('follow_up_history')
      .insert({ customer_id: Number(id), action: 'NOTE', note })
      .select()
      .single();
    throwIf(error);
    return data;
  },

  // ------------------------------------------------------------------ //
  // Calendar                                                            //
  // ------------------------------------------------------------------ //
  async calendar(month) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const start = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('follow_up_history')
      .select('*, customers!inner(id, name, group_id, groups!inner(name))')
      .gte('created_at', `${start}T00:00:00Z`)
      .lt('created_at', `${next}T00:00:00Z`)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    throwIf(error);

    const days = {};
    const seen = new Set();
    for (const r of data || []) {
      const t = String(r.created_at).match(/(\d{2}:\d{2})/);
      const day = String(r.created_at).slice(0, 10);
      const entry = {
        id: r.id,
        action: r.action,
        note: r.note,
        time: t ? t[1] : '',
        customer_id: r.customers?.id,
        customer_name: r.customers?.name,
        group_name: r.customers?.groups?.name,
      };
      (days[day] = days[day] || []).push(entry);
      seen.add(r.customers?.id);
    }

    return { month, entries: (data || []).length, customer_count: seen.size, days };
  },
};

// --- subscription status (mirrors server/utils/helpers.js) ---
function parseDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function subscriptionStatus(expiryISO) {
  const exp = parseDate(expiryISO);
  if (!exp) return 'ACTIVE';
  const today = parseDate(todayISO());
  const DAY = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((exp - today) / DAY);
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

// --- group stats (mirrors server/db.js shapeGroup + deriveGroupStatus) ---
async function groupStats(groupId) {
  const { count: total, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);
  if (error) throw new Error(error.message);
  const { count: completed } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('follow_up_status', 'COMPLETED');
  return {
    total_customers: total ?? 0,
    completed: completed ?? 0,
    pending: (total ?? 0) - (completed ?? 0),
  };
}

function deriveGroupStatus(total, pending) {
  if (total === 0) return { status: 'KOSONG', color: 'neutral' };
  if (pending > 0) return { status: 'BELUM SELESAI', color: 'red' };
  return { status: 'SELESAI', color: 'green' };
}

async function shapeGroup(groupId) {
  const row = await supabase.from('groups').select('*').eq('id', groupId).single();
  const g = row.data;
  if (!g) return null;
  const s = await groupStats(groupId);
  const { status, color } = deriveGroupStatus(s.total_customers, s.pending);
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    created_at: g.created_at,
    updated_at: g.updated_at,
    ...s,
    status,
    color,
  };
}
