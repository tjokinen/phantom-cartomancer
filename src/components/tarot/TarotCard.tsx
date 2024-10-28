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
        relative w-[240px] h-[420px] 
        transition-all duration-700 ease-in-out cursor-pointer
        hover:scale-105
        ${isRevealed ? 'rotate-0' : 'rotate-180'}
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
            sizes="240px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/50" />
          <div className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium">
            <h3 className="text-lg mb-1">{cardData.name}</h3>
            <p className="opacity-75 text-xs">{cardData.description}</p>
          </div>
        </div>
        <div className={`
          absolute inset-0
          transition-opacity duration-700
          ${isRevealed ? 'opacity-0' : 'opacity-100'}
        `}>
          <div className="absolute inset-0 bg-indigo-900 bg-opacity-90">
            <div className="absolute inset-0 bg-[url('/cards/card-back.jpg')] bg-cover bg-center opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
