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
}

export type StartGameResponse = GameStateResponse

export type MakeChoiceResponse = {
  success: boolean
  story: string
  choices: string[]
  character_info: CharacterInfo
  session_id: string
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


