'use client';

import { TAROT_CARDS } from '@/lib/tarot/cards';
import Image from 'next/image';

interface TarotCardProps {
  name: string;
  position: 'upright' | 'reversed';
  isRevealed: boolean;
  onClick?: () => void;
}

export default function TarotCard({ name, position, isRevealed, onClick }: TarotCardProps) {
  const cardData = TAROT_CARDS[name];

  if (!cardData) {
    console.error(`Card data not found for: ${name}`);
    return null;
  }

  return (
    <div 
      className={`
        relative w-[160px] h-[280px]
        transition-all duration-700 ease-in-out cursor-pointer
        hover:scale-105
        ${position === 'reversed' && isRevealed ? 'rotate-180' : ''}
      `}
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl">
        <div className={`
          relative w-full h-full
          transition-opacity duration-700
          ${isRevealed ? 'opacity-100' : 'opacity-0'}
        `}>
          <Image
            src={cardData.image}
            alt={`${cardData.name} ${position}`}
            fill
            className="object-cover"
            sizes="160px"
            priority
            onError={(e) => {
              console.error(`Failed to load image: ${cardData.image}`);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/50" />
        </div>
        <div className={`
          absolute inset-0
          transition-opacity duration-700
          ${isRevealed ? 'opacity-0' : 'opacity-100'}
        `}>
          <div className="absolute inset-0 bg-indigo-900 bg-opacity-90">
            <div className="absolute inset-0 bg-[url('/cards/card-back.png')] bg-cover bg-center opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
