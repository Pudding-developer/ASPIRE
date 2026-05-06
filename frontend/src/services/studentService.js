import { request } from './api';

export const studentService = {
  getProfile:      ()           => request('GET',   '/api/student/profile'),
  getClasses:      ()           => request('GET',   '/api/student/classes'),
  getArchivedClasses: ()        => request('GET',   '/api/student/classes/archived'),
  getScores:       ()           => request('GET',   '/api/student/scores'),
  getPredictions:  ()           => request('GET',   '/api/student/predictions'),
  getCourseDashboard: (course)  => request('GET',   `/api/student/dashboard?course=${encodeURIComponent(course)}`),
  joinClass:       (classCode)  => request('POST',  '/api/student/join', { class_code: classCode }),

  // Career goal selection
  getChosenCareer: ()           => request('GET',   '/api/student/career'),
  setChosenCareer: (career)     => request('PATCH', '/api/student/career', { career }),

  // Skill interventions (independent of the 7-agent pipeline)
  getInterventions: (studentId) => request('GET',  `/api/student/interventions/${studentId}`),
  runInterventions: (studentId) => request('POST', `/api/student/interventions/${studentId}`),

  // Activity feed
  getActivityFeed: (limit = 10, unreadOnly = false) =>
    request('GET', `/api/student/activity?limit=${limit}&unread_only=${unreadOnly}`),
  markActivityRead: () => request('POST', '/api/student/activity/read-all'),
};
