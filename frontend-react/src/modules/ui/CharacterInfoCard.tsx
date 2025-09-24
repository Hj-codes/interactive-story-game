import type { CharacterInfo } from '@/types'

export function CharacterInfoCard({ character }: { character: CharacterInfo }) {
  const hasTraits = character.traits && character.traits.length > 0
  const hasInv = character.inventory && character.inventory.length > 0
  return (
    <div className="rounded-xl border-l-4 border-sky-500 bg-sky-50 p-5">
      <h3 className="text-lg font-semibold text-slate-800">Character Info</h3>
      <div className="mt-2 text-slate-700">
        <p className="mb-2">
          <span className="font-semibold">Name:</span> {character.name || 'Player'}
        </p>
        {hasTraits && (
          <p className="mb-2">
            <span className="font-semibold">Traits:</span> {character.traits.join(', ')}
          </p>
        )}
        {hasInv && (
          <p className="mb-2">
            <span className="font-semibold">Inventory:</span> {character.inventory.join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}


