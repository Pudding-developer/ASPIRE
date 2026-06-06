import { request } from './api';

export const studentService = {
  getProfile:      ()           => request('GET',   '/api/student/profile'),
  getClasses:      ()           => request('GET',   '/api/student/classes'),
  getArchivedClasses: ()        => request('GET',   '/api/student/classes/archived'),
  getScores:       ()           => request('GET',   '/api/student/scores'),
  getPredictions:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/student/predictions${qs ? '?' + qs : ''}`);
  },
  getCourseDashboard: (course)  => request('GET',   `/api/student/dashboard?course=${encodeURIComponent(course)}`),
  joinClass:       (classCode)  => request('POST',  '/api/student/join', { class_code: classCode }),

  // Career goal selection
  getCareers:      ()           => request('GET',   '/api/student/careers'),
  getChosenCareer: ()           => request('GET',   '/api/student/career'),
  setChosenCareer: (career)     => request('PATCH', '/api/student/career', { career }),



  // Activity feed
  getActivityFeed: (limit = 10, unreadOnly = false) =>
    request('GET', `/api/student/activity?limit=${limit}&unread_only=${unreadOnly}`),
  markActivityRead: () => request('POST', '/api/student/activity/read-all'),
};
