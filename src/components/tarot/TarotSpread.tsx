'use client';

import { useTarot } from '@/lib/context/TarotContext';
import TarotCard from './TarotCard';

export default function TarotSpread() {
  const { cards, revealCard } = useTarot();

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex gap-4">
      {cards.map((card, index) => (
        <TarotCard
          key={`${card.name}-${index}`}
          name={card.name}
          position={card.position}
          isRevealed={card.isRevealed}
          onClick={() => revealCard(index)}
        />
      ))}
    </div>
  );
} 