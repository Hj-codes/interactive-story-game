import { apiGet, apiPost } from './client'
import type {
  StartGameResponse,
  MakeChoiceResponse,
  GameStateResponse,
  ListSavesResponse,
  HistoryResponse,
} from '@/types'

export const GameAPI = {
  start(character_name: string) {
    return apiPost<StartGameResponse>('/game/start', { character_name })
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
  history(session_id: string) {
    return apiGet<HistoryResponse>(`/story/history/${session_id}`)
  },
}


