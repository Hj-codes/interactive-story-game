export type CharacterInfo = {
  name: string
  traits: string[]
  inventory: string[]
}

export type ChoiceHistoryEntry = {
  choice: string
  story_segment: string
  timestamp?: string
}

export type GameStateResponse = {
  success: boolean
  session_id: string
  current_story: string
  choices: string[]
  character_info: CharacterInfo
  choices_history?: ChoiceHistoryEntry[]
  image?: string | null
}

export type StartGameResponse = GameStateResponse

export type MakeChoiceResponse = {
  success: boolean
  story: string
  choices: string[]
  character_info: CharacterInfo
  session_id: string
  error?: string
  image?: string | null
}

export type SavedGameSummary = {
  id: string
  save_name: string
  saved_at: string
}

export type ListSavesResponse = {
  success: boolean
  saved_games: SavedGameSummary[]
}

export type HistoryResponse = {
  success: boolean
  choices_history: ChoiceHistoryEntry[]
  current_story: string
  character_info: CharacterInfo
}

export type PersonalityTraitKey =
  | 'bravery'
  | 'empathy'
  | 'cunning'
  | 'honor'
  | 'curiosity'
  | 'caution'

export type PersonalityEvidence = {
  choice: string
  signal: string
  trait: PersonalityTraitKey
}

export type PersonalityProfile = {
  session_id: string
  archetype: string
  summary: string
  trait_scores: Record<PersonalityTraitKey, number>
  evidence: PersonalityEvidence[]
  choices_analyzed: number
  cache_status: 'cached' | 'generated' | 'stale_fallback'
  analyzed_at: string
}

export type GetPersonalityResponse = {
  success: boolean
  has_profile: boolean
  is_stale?: boolean
  profile?: PersonalityProfile
  error?: string
  code?: string
}

export type AnalyzePersonalityResponse = {
  success: boolean
  profile?: PersonalityProfile
  cache_status?: PersonalityProfile['cache_status']
  warning?: string
  error?: string
  code?: string
}


