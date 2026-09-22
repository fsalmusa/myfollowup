/**
 * Thin API client over fetch. All endpoints live under /api.
 */

async function request(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Ralat: permintaan gagal.');
  }
  return data;
}

export const api = {
  // Stats
  stats: () => request('GET', '/api/stats'),

  // Groups
  listGroups: (search = '') =>
    request('GET', `/api/groups${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getGroup: (id) => request('GET', `/api/groups/${id}`),
  createGroup: (payload) => request('POST', '/api/groups', payload),
  updateGroup: (id, payload) => request('PUT', `/api/groups/${id}`, payload),
  deleteGroup: (id) => request('DELETE', `/api/groups/${id}`),
  groupCustomers: (id, { search = '', status = '' } = {}) =>
    request(
      'GET',
      `/api/groups/${id}/customers?${new URLSearchParams({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      }).toString()}`
    ),

  // Customers
  listCustomers: (params = {}) =>
    request('GET', `/api/customers?${new URLSearchParams(params).toString()}`),
  getCustomer: (id) => request('GET', `/api/customers/${id}`),
  createCustomer: (payload) => request('POST', '/api/customers', payload),
  updateCustomer: (id, payload) => request('PUT', `/api/customers/${id}`, payload),
  deleteCustomer: (id) => request('DELETE', `/api/customers/${id}`),
  toggleFollowUp: (id, status, note) =>
    request('POST', `/api/customers/${id}/followup`, { status, note }),
  getHistory: (id) => request('GET', `/api/customers/${id}/history`),
  addHistoryNote: (id, note) => request('POST', `/api/customers/${id}/history`, { note }),

  // Calendar
  calendar: (month) =>
    request('GET', `/api/calendar${month ? `?month=${encodeURIComponent(month)}` : ''}`),
};
