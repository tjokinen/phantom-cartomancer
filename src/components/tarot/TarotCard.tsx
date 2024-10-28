'use client';

interface TarotCardProps {
  name: string;
  position: 'upright' | 'reversed';
  isRevealed: boolean;
  onClick?: () => void;
}

export default function TarotCard({ name, position, isRevealed, onClick }: TarotCardProps) {
  return (
    <div 
      className={`
        relative w-48 h-80 
        transition-transform duration-1000 ease-in-out cursor-pointer
        ${isRevealed ? 'rotate-0' : 'rotate-180'}
        ${position === 'reversed' && isRevealed ? 'rotate-180' : ''}
      `}
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded-lg shadow-lg overflow-hidden">
        {isRevealed ? (
          <img 
            src={`/cards/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`} 
            alt={`${name} ${position}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-900 bg-opacity-90 flex items-center justify-center">
            <div className="text-white text-opacity-20 text-2xl">🌙</div>
          </div>
        )}
      </div>
    </div>
  );
}
