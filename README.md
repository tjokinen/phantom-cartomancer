<img width="1005" alt="image" src="https://github.com/user-attachments/assets/cf299940-8aa1-449c-8f11-418b88d55dac">

# Phantom Cartomancer

A mystical web application that brings the art of tarot reading into the digital age, featuring a Victorian-era spirit guide powered by AI.

## Features

- **Voice Interaction**: Speak directly with the Phantom Cartomancer through your microphone
- **Animated 3D Environment**: Immersive mystical atmosphere created with Spline
- **Tarot Card Readings**: Full major arcana deck with upright and reversed interpretations
- **Real-time Animations**: Dynamic mouth movements synchronized with AI speech
- **Responsive Design**: Scales beautifully across different screen sizes

![image](https://github.com/user-attachments/assets/6b513313-fc40-49d0-8178-d4180bf77b72)

## Technology Stack

- Next.js 15.0.1
- React 19.0
- TypeScript
- Tailwind CSS
- OpenAI API
- Spline for 3D graphics

## Core Components

### Voice Interface
The main interaction point where users can speak with the Cartomancer. Features:
- Voice recording with visual feedback
- Real-time audio processing
- Subtitled AI responses
- Animated state indicators

### Tarot Cards
A digital representation of the major arcana, featuring:
- Smooth reveal animations
- Upright/reversed positions
- Interactive card spreads

### AI Integration
The Phantom Cartomancer's personality and behavior are defined through:
- Victorian-era character traits
- Tarot reading expertise
- Natural language processing
- Function calling for card interactions

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up your environment variables:
```env
OPENAI_API_KEY=your_api_key_here
```
4. Run the development server:
```bash
npm run dev
```

## Project Structure

- `/src/components`: React components for UI elements
- `/src/lib`: Core utilities and context providers
- `/public/cards`: Tarot card images and assets
- `/public/spline`: 3D scene file

## Credits

- 3D Environment: Created with Spline
- Tarot Card Artwork: Wikimedia Commons, Public Domain
- Font: Pirata One
- AI Technology: OpenAI
