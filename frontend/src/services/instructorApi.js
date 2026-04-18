import { request } from './api';

const BASE = '/api/instructor';

export const instructorApi = {
  getDashboardStats: ()              => request('GET',    `${BASE}/dashboard`),
  getClasses:        ()              => request('GET',    `${BASE}/classes`),
  getArchivedClasses:()              => request('GET',    `${BASE}/classes/archived`),
  getClassStudents:  (id)            => request('GET',    `${BASE}/classes/${id}/students`),
  createClass:       (data)          => request('POST',   `${BASE}/classes`, data),
  archiveClass:      (id)            => request('PATCH',  `${BASE}/classes/${id}/archive`),
  deleteClass:       (id)            => request('DELETE', `${BASE}/classes/${id}`),
  submitAssessmentScores: (classId, data) => request('POST', `${BASE}/classes/${classId}/assessments/submit`, data),
  getClassAssessments: (classId) => request('GET', `${BASE}/classes/${classId}/assessments`),
  getClassAssessmentDetails: (classId, assessmentId) => request('GET', `${BASE}/classes/${classId}/assessments/${assessmentId}`),
  updateAssessmentScores: (classId, assessmentId, data) => request('PUT', `${BASE}/classes/${classId}/assessments/${assessmentId}`, data),
  deleteAssessment: (classId, assessmentId) => request('DELETE', `${BASE}/classes/${classId}/assessments/${assessmentId}`),
};
