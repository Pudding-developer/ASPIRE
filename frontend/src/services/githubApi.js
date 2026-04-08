/**
 * githubApi.js — Frontend calls to /api/github/* backend endpoints.
 */
import { request } from './api';

const BASE = '/api/github';

export const githubApi = {
  /** Get connection status (connected, username, last_analyzed) */
  getStatus:        ()       => request('GET',    `${BASE}/status`),

  /** Get the OAuth URL to start GitHub connection flow */
  getConnectUrl:    ()       => request('GET',    `${BASE}/connect`),

  /** Disconnect GitHub account */
  disconnect:       ()       => request('DELETE', `${BASE}/disconnect`),

  /** Trigger a new analysis job — returns { job_id } */
  startAnalysis:    ()       => request('POST',   `${BASE}/analyze`),

  /** Poll analysis job progress */
  getAnalysisStatus:(jobId)  => request('GET',    `${BASE}/analyze/status/${jobId}`),

  /** Get analyzed summary (profile stats, top languages, etc.) */
  getSummary:       ()       => request('GET',    `${BASE}/summary`),

  /** Get repository list with languages, topics, commit counts */
  getRepositories:  ()       => request('GET',    `${BASE}/repositories`),

  /** Get contribution data (streaks, totals, calendar) */
  getContributions: ()       => request('GET',    `${BASE}/contributions`),
};
