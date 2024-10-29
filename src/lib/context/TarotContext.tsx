'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { PHANTOM_CARTOMANCER_PROMPT } from '../openai';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  function_call?: any;
}

interface TarotCard {
  name: string;
  position: 'upright' | 'reversed';
  isRevealed: boolean;
}

interface TarotContextType {
  cards: TarotCard[];
  messages: Message[];
  addCard: (name: string, position?: 'upright' | 'reversed') => void;
  revealCard: (index: number) => void;
  clearCards: () => void;
  addMessage: (message: Message) => void;
  clearHistory: () => void;
}

const TarotContext = createContext<TarotContextType | undefined>(undefined);

export function TarotProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: PHANTOM_CARTOMANCER_PROMPT 
    }
  ]);

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

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    console.log('Messages after adding:', messages);
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return (
    <TarotContext.Provider value={{ 
      cards, 
      messages, 
      addCard, 
      revealCard, 
      clearCards, 
      addMessage,
      clearHistory 
    }}>
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
