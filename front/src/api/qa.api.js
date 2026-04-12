import api from './axios.js'

export const qaApi = {
  getSessions: () => api.get('/qa/sessions'),
  getMessages: (sessionId) => api.get(`/qa/sessions/${sessionId}/messages`),
  // ask는 Fetch Streaming으로 별도 처리 (useQAStream 훅)

  deleteSession: (sessionId) => api.delete(`/qa/sessions/${sessionId}`),
  renameSession: (sessionId, title) => api.patch(`/qa/sessions/${sessionId}`, { title }),

  // 에스컬레이션
  getEscalations: (params) =>
    api.get('/qa/escalations', { params }),
  replyEscalation: (id, response) =>
    api.post(`/qa/escalations/${id}/reply`, { response }),
}
