import { apiGet, apiPost, apiPostBlob } from './client'
import type {
  StartGameResponse,
  MakeChoiceResponse,
  GameStateResponse,
  ListSavesResponse,
  HistoryResponse,
} from '@/types'

export interface GameSession {
  id: string
  character_name: string
  story_preview: string
  created_at: string
  updated_at: string
}

export interface ListSessionsResponse {
  success: boolean
  sessions: GameSession[]
  error?: string
}

export const GameAPI = {
  start(character_name: string, initial_story?: string) {
    return apiPost<StartGameResponse>('/game/start', { character_name, initial_story })
  },
  makeChoice(session_id: string, choice_index: number) {
    return apiPost<MakeChoiceResponse>('/game/choice', { session_id, choice_index })
  },
  getState(session_id: string) {
    return apiGet<GameStateResponse>(`/game/state/${session_id}`)
  },
  save(session_id: string, save_name: string) {
    return apiPost<{ success: boolean; save_id?: string; message?: string; error?: string }>(
      '/game/save',
      { session_id, save_name },
    )
  },
  load(save_id: string) {
    return apiPost<StartGameResponse>(`/game/load/${save_id}`)
  },
  listSaves(session_id?: string) {
    const qs = session_id ? `?session_id=${encodeURIComponent(session_id)}` : ''
    return apiGet<ListSavesResponse>(`/game/saves${qs}`)
  },
  listSessions(limit?: number) {
    const qs = limit ? `?limit=${limit}` : ''
    return apiGet<ListSessionsResponse>(`/game/sessions${qs}`)
  },
  history(session_id: string) {
    return apiGet<HistoryResponse>(`/story/history/${session_id}`)
  },
  narrate(text: string, opts?: { speaker?: string; speaker_wav?: string }) {
    return apiPostBlob('/narrate', { text, ...opts })
  },
}
