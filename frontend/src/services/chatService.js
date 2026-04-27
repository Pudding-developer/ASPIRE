import { request } from './api';

export const chatService = {
  /** Create a new session tied to the student's current career report. */
  createSession: (context) =>
    request('POST', '/api/chat/session', { context }),

  /** Send a message in an existing session. History is loaded from the DB. */
  sendCareerMessage: (sessionId, message, context, options) =>
    request('POST', '/api/chat/career', { session_id: sessionId, message, context }, options),

  /** Load the full message history for a session. */
  getSession: (sessionId) =>
    request('GET', `/api/chat/session/${sessionId}`),

  /** List all sessions for the current student. */
  listSessions: () =>
    request('GET', '/api/chat/sessions'),

  /** Delete a session and all its messages. */
  deleteSession: (sessionId) =>
    request('DELETE', `/api/chat/session/${sessionId}`),
};
