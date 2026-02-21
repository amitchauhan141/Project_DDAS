const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', token, body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(payload?.error?.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return payload;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: (token) => request('/auth/logout', { method: 'POST', token }),
  getMyDatasets: (token) => request('/datasets', { token }),
  getDatasetDetail: (id, token) => request(`/datasets/${id}`, { token }),
  deleteDataset: (id, token) => request(`/datasets/${id}`, { method: 'DELETE', token }),
  downloadDataset: (id, token) => request(`/datasets/${id}/download`, { method: 'POST', token }),
  renameDataset: (id, name, token) => request(`/datasets/${id}/rename`, { method: 'PATCH', token, body: { name } }),
  shareWithUser: (token, body) => request('/sharing/user', { method: 'POST', token, body }),
  shareWithDepartment: (token, body) => request('/sharing/department', { method: 'POST', token, body }),
  getSharedWithMe: (token) => request('/sharing/with-me', { token }),
  getSharedByMe: (token) => request('/sharing/by-me', { token }),
  getAccessRequests: (token) => request('/access-requests', { token }),
  approveRequest: (id, token) => request(`/access-requests/${id}/approve`, { method: 'POST', token }),
  rejectRequest: (id, token) => request(`/access-requests/${id}/reject`, { method: 'POST', token }),
  requestAccess: (token, body) => request('/access-requests', { method: 'POST', token, body }),
  listDepartments: (token) => request('/departments', { token }),
  searchDatasets: (q, token) => request(`/search?query=${encodeURIComponent(q)}`, { token })
};
