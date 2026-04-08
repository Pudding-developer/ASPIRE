import { request } from './api';

const BASE = '/api/instructor';

export const instructorApi = {
  getDashboardStats: ()              => request('GET',    `${BASE}/dashboard`),
  getClasses:        ()              => request('GET',    `${BASE}/classes`),
  getArchivedClasses:()              => request('GET',    `${BASE}/classes/archived`),
  createClass:       (data)          => request('POST',   `${BASE}/classes`, data),
  archiveClass:      (id)            => request('PATCH',  `${BASE}/classes/${id}/archive`),
  deleteClass:       (id)            => request('DELETE', `${BASE}/classes/${id}`),
};
