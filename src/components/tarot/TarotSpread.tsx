'use client';

import { useTarot } from '@/lib/context/TarotContext';
import TarotCard from './TarotCard';

export default function TarotSpread() {
  const { cards, revealCard } = useTarot();

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2">
      <div className="flex gap-6 items-center justify-center">
        {cards.map((card, index) => (
          <div
            key={`${card.name}-${index}`}
            className="opacity-0 translate-y-full animate-card-enter"
            style={{
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'forwards'
            }}
          >
            <TarotCard
              name={card.name}
              position={card.position}
              isRevealed={card.isRevealed}
              onClick={() => revealCard(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 