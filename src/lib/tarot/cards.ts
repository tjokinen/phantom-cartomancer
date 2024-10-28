export interface TarotCardData {
  name: string;
  image: string;
  description: string;
}

export const TAROT_CARDS: Record<string, TarotCardData> = {
  "The Fool": {
    name: "The Fool",
    image: "/cards/major/the-fool.png",
    description: "New beginnings, innocence, spontaneity, free spirit"
  },
  "The Magician": {
    name: "The Magician",
    image: "/cards/major/the-magician.png",
    description: "Manifestation, resourcefulness, power, inspired action"
  },
  "The High Priestess": {
    name: "The High Priestess",
    image: "/cards/major/the-high-priestess.png",
    description: "Intuition, sacred knowledge, divine feminine, the subconscious mind"
  },
  "The Empress": {
    name: "The Empress",
    image: "/cards/major/the-empress.png",
    description: "Femininity, beauty, nature, nurturing, abundance"
  },
  "The Emperor": {
    name: "The Emperor",
    image: "/cards/major/the-emperor.png",
    description: "Authority, establishment, structure, a father figure"
  },
  "The Hierophant": {
    name: "The Hierophant",
    image: "/cards/major/the-hierophant.png",
    description: "Spiritual wisdom, religious beliefs, conformity, tradition"
  },
  "The Lovers": {
    name: "The Lovers",
    image: "/cards/major/the-lovers.png",
    description: "Love, harmony, relationships, values alignment, choices"
  },
  "The Chariot": {
    name: "The Chariot",
    image: "/cards/major/the-chariot.png",
    description: "Control, willpower, success, ambition, determination"
  },
  "Strength": {
    name: "Strength",
    image: "/cards/major/strength.png",
    description: "Inner strength, bravery, compassion, focus, persuasion"
  },
  "The Hermit": {
    name: "The Hermit",
    image: "/cards/major/the-hermit.png",
    description: "Soul-searching, introspection, being alone, inner guidance"
  },
  "Wheel of Fortune": {
    name: "Wheel of Fortune",
    image: "/cards/major/wheel-of-fortune.png",
    description: "Good luck, karma, life cycles, destiny, a turning point"
  },
  "Justice": {
    name: "Justice",
    image: "/cards/major/justice.png",
    description: "Justice, fairness, truth, cause and effect, law"
  },
  "The Hanged Man": {
    name: "The Hanged Man",
    image: "/cards/major/the-hanged-man.png",
    description: "Surrender, letting go, new perspectives, sacrifice"
  },
  "Death": {
    name: "Death",
    image: "/cards/major/death.png",
    description: "Endings, change, transformation, transition"
  },
  "Temperance": {
    name: "Temperance",
    image: "/cards/major/temperance.png",
    description: "Balance, moderation, patience, purpose, meaning"
  },
  "The Devil": {
    name: "The Devil",
    image: "/cards/major/the-devil.png",
    description: "Shadow self, attachment, addiction, restriction, sexuality"
  },
  "The Tower": {
    name: "The Tower",
    image: "/cards/major/the-tower.png",
    description: "Sudden change, upheaval, chaos, revelation, awakening"
  },
  "The Star": {
    name: "The Star",
    image: "/cards/major/the-star.png",
    description: "Hope, faith, purpose, renewal, spirituality"
  },
  "The Moon": {
    name: "The Moon",
    image: "/cards/major/the-moon.png",
    description: "Illusion, fear, anxiety, subconscious, intuition"
  },
  "The Sun": {
    name: "The Sun",
    image: "/cards/major/the-sun.png",
    description: "Positivity, fun, warmth, success, vitality"
  },
  "Judgement": {
    name: "Judgement",
    image: "/cards/major/judgement.png",
    description: "Judgement, rebirth, inner calling, absolution"
  },
  "The World": {
    name: "The World",
    image: "/cards/major/the-world.png",
    description: "Completion, integration, accomplishment, travel"
  }
};

// Helper function to get a random card
export const getRandomCard = (): TarotCardData => {
  const cards = Object.values(TAROT_CARDS);
  return cards[Math.floor(Math.random() * cards.length)];
};

// Helper function to validate card name
export const isValidCardName = (name: string): boolean => {
  return name in TAROT_CARDS;
}; 