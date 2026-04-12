import { create } from 'zustand'
import api from '../api/axios.js'

export const useQAStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isAITyping: false,
  streamingText: '',
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/qa/sessions')
      set({ sessions: data.data || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  startSession: async () => {
    try {
      const data = await api.post('/qa/sessions')
      const session = data.data
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSession: session,
        messages: [],
      }))
      return session
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  selectSession: async (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    set({ currentSession: session, isLoading: true })
    try {
      const data = await api.get(`/qa/sessions/${sessionId}/messages`)
      set({ messages: data.data || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  addUserMessage: (text) => {
    const msg = { id: Date.now(), role: 'user', content: text, createdAt: new Date().toISOString() }
    set((state) => ({ messages: [...state.messages, msg] }))
    return msg
  },

  startAIResponse: () => {
    set({ isAITyping: true, streamingText: '' })
  },

  appendStreamChunk: (chunk) =>
    set((state) => ({ streamingText: state.streamingText + chunk })),

  finalizeStream: (messageId, isEscalated = false) => {
    const { streamingText, messages } = get()
    const aiMsg = {
      id: messageId || Date.now(),
      role: 'ai',
      content: streamingText,
      isEscalated,
      createdAt: new Date().toISOString(),
    }
    set({ messages: [...messages, aiMsg], isAITyping: false, streamingText: '' })
  },

  clearMessages: () => set({ messages: [], currentSession: null, streamingText: '' }),

  deleteSession: async (sessionId) => {
    await api.delete(`/qa/sessions/${sessionId}`)
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
      messages: state.currentSession?.id === sessionId ? [] : state.messages,
    }))
  },

  renameSession: async (sessionId, title) => {
    const data = await api.patch(`/qa/sessions/${sessionId}`, { title })
    const updated = data.data
    set((state) => ({
      sessions: state.sessions.map((s) => s.id === sessionId ? { ...s, title } : s),
      currentSession: state.currentSession?.id === sessionId
        ? { ...state.currentSession, title }
        : state.currentSession,
    }))
    return updated
  },
}))
