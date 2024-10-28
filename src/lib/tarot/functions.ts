export const tarotFunctions = [
  {
    name: "drawCard",
    description: "Draw a new tarot card from the deck",
    parameters: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          enum: [
            "The Fool",
            "The Magician",
            "The High Priestess",
            "The Empress",
            "The Emperor",
            "The Hierophant",
            "The Lovers",
            "The Chariot",
            "Strength",
            "The Hermit",
            "Wheel of Fortune",
            "Justice",
            "The Hanged Man",
            "Death",
            "Temperance",
            "The Devil",
            "The Tower",
            "The Star",
            "The Moon",
            "The Sun",
            "Judgement",
            "The World"
          ],
          description: "The name of the tarot card to draw"
        },
        position: {
          type: "string",
          enum: ["upright", "reversed"],
          description: "The position of the card"
        }
      },
      required: ["cardName"]
    }
  },
  {
    name: "revealCard",
    description: "Reveal a card that has been drawn",
    parameters: {
      type: "object",
      properties: {
        index: {
          type: "number",
          description: "The index of the card to reveal (0-based)"
        }
      },
      required: ["index"]
    }
  },
  {
    name: "clearCards",
    description: "Clear all cards from the spread",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];
