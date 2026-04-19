import { request } from './api';

export const chatService = {
  sendCareerMessage: (messages, context) =>
    request('POST', '/api/chat/career', { messages, context }),
};
