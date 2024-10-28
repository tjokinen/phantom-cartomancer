'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface TarotCard {
  name: string;
  position: 'upright' | 'reversed';
  isRevealed: boolean;
}

interface TarotContextType {
  cards: TarotCard[];
  addCard: (name: string, position?: 'upright' | 'reversed') => void;
  revealCard: (index: number) => void;
  clearCards: () => void;
}

const TarotContext = createContext<TarotContextType | undefined>(undefined);

export function TarotProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<TarotCard[]>([]);

  const addCard = (name: string, position: 'upright' | 'reversed' = Math.random() > 0.5 ? 'upright' : 'reversed') => {
    setCards(prev => [...prev, { name, position, isRevealed: false }]);
  };

  const revealCard = (index: number) => {
    setCards(prev => prev.map((card, i) => 
      i === index ? { ...card, isRevealed: true } : card
    ));
  };

  const clearCards = () => {
    setCards([]);
  };

  return (
    <TarotContext.Provider value={{ cards, addCard, revealCard, clearCards }}>
      {children}
    </TarotContext.Provider>
  );
}

export function useTarot() {
  const context = useContext(TarotContext);
  if (context === undefined) {
    throw new Error('useTarot must be used within a TarotProvider');
  }
  return context;
}
