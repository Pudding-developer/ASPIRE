import { request } from './api';

export const studentService = {
  getProfile:      ()           => request('GET',   '/api/student/profile'),
  getClasses:      ()           => request('GET',   '/api/student/classes'),
  getScores:       ()           => request('GET',   '/api/student/scores'),
  getPredictions:  ()           => request('GET',   '/api/student/predictions'),
  joinClass:       (classCode)  => request('POST',  '/api/student/join', { class_code: classCode }),

  // Career goal selection
  getChosenCareer: ()           => request('GET',   '/api/student/career'),
  setChosenCareer: (career)     => request('PATCH', '/api/student/career', { career }),
};
