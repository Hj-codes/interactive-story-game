import type { CharacterInfo } from '@/types'
import { User } from 'lucide-react'

export function CharacterInfoCard({ character }: { character: CharacterInfo }) {
  const hasTraits = character.traits && character.traits.length > 0
  const hasInv = character.inventory && character.inventory.length > 0

  return (
    <div className="glass rounded-lg px-4 py-3 border border-gray-800/50">
      <div className="flex items-center gap-3">
        <User className="w-4 h-4 text-[--fantasy-gold]" />
        <span className="font-serif text-xs font-bold text-[--fantasy-gold] tracking-wider uppercase">Character</span>
        <span className="font-serif text-sm text-white ml-2">{character.name || 'Player'}</span>
      </div>

      {(hasTraits || hasInv) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {character.traits?.map((trait, i) => (
            <span key={`t-${i}`} className="px-2 py-0.5 text-[10px] rounded-full bg-[--fantasy-purple]/20 border border-[--fantasy-purple]/40 text-purple-300">
              {trait}
            </span>
          ))}
          {character.inventory?.map((item, i) => (
            <span key={`i-${i}`} className="px-2 py-0.5 text-[10px] rounded-full bg-[--fantasy-green]/20 border border-[--fantasy-green]/40 text-green-300">
              {item}
            </span>
          ))}
        </div>
      )}

      {!hasTraits && !hasInv && (
        <p className="text-gray-600 text-[10px] italic mt-1">Your journey has just begun...</p>
      )}
    </div>
  )
}
