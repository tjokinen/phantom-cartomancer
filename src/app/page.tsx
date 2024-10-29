"use client";

import { Application } from '@splinetool/runtime';
import Spline from '@splinetool/react-spline';
import { useState, useCallback } from 'react';
import { TarotProvider } from '@/lib/context/TarotContext';
import { ApiKeyProvider } from '@/lib/context/ApiKeyContext';
import { Pirata_One } from 'next/font/google';
import TarotSpread from '@/components/tarot/TarotSpread';
import VoiceInterface from '@/components/audio/VoiceInterface';
import ApiKeyGate from '@/components/ApiKeyGate';

const pirataFont = Pirata_One({ 
  weight: '400',
  subsets: ['latin']
});

export default function Home() {
  const [splineApp, setSplineApp] = useState<Application | null>(null);
  const [showStartButton, setShowStartButton] = useState(true);

  const onLoad = useCallback((splineApp: Application) => {
    setSplineApp(splineApp);
    // Set initial mouth position
    splineApp.setVariable('mouth', 10);
  }, []);

  return (
    <ApiKeyProvider>
      <TarotProvider>
        <main className="relative h-screen w-screen overflow-hidden bg-background">
          <div className="absolute inset-0">
            <Spline
              scene="/spline/scene.splinecode"
              onLoad={onLoad}
            />
          </div>

          <div className="absolute top-6 left-0 right-0 text-center">
            <h1 className={`${pirataFont.className} text-4xl text-purple-200/90 tracking-wider`}>
              Phantom Cartomancer
            </h1>
          </div>

          <ApiKeyGate>
            <TarotSpread />
            {!showStartButton && <VoiceInterface splineApp={splineApp} />}
          </ApiKeyGate>

          {showStartButton && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div 
                className="relative group cursor-pointer"
                onClick={() => setShowStartButton(false)}
              >
                <div className="absolute inset-0 rounded-full border-2 border-purple-300/30 animate-pulse" />
                <div className="relative p-8 text-center">
                  <p className={`${pirataFont.className} text-2xl text-purple-200/90 tracking-wider`}>
                    Begin Your Reading
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </TarotProvider>
    </ApiKeyProvider>
  );
}
