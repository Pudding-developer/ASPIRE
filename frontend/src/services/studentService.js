import { request } from './api';

export const studentService = {
  getProfile: () => request('GET', '/student/profile'),
  getClasses: () => request('GET', '/student/classes'),
  getScores: () => request('GET', '/student/scores'),
  getPredictions: () => request('GET', '/student/predictions'),
};
