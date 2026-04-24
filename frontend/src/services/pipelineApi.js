/**
 * pipelineApi.js — Frontend calls to /pipeline/* backend endpoints.
 */
import { request } from './api';

const BASE = '/api/pipeline';

export const pipelineApi = {
  /** Launch AI pipeline for a student — returns { job_id } */
  run:           (studentId) => request('POST', `${BASE}/run/${studentId}`),

  /** Poll pipeline job status (percentage, current_step, etc.) */
  getStatus:     (jobId)     => request('GET',  `${BASE}/status/${jobId}`),

  /** Get the latest career report for a student */
  getReport:     (studentId) => request('GET',  `${BASE}/report/${studentId}`),

  /** Get all career reports for a student */
  getAllReports:  (studentId) => request('GET',  `${BASE}/reports/${studentId}`),
};
