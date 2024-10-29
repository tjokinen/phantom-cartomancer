"use client";

import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { useState, useCallback, useEffect, useRef } from 'react';
import VoiceInterface from '@/components/audio/VoiceInterface';
import TarotSpread from '@/components/tarot/TarotSpread';
import { TarotProvider } from '@/lib/context/TarotContext';

export default function Home() {
  const [splineApp, setSplineApp] = useState<Application | null>(null);
  const hasAnimated = useRef(false);

  const animateBrightness = useCallback(() => {
    if (!splineApp || hasAnimated.current) return;
    
    hasAnimated.current = true;
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const animate = () => {
      const currentTime = Date.now() - startTime;
      const progress = Math.min(currentTime / duration, 1);
      
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const brightness = easeOutProgress * 70;
      
      splineApp.setVariable('brightness', brightness);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('Animation completed at brightness:', brightness);
      }
    };

    animate();
  }, [splineApp]);

  // Start animation when splineApp is set
  useEffect(() => {
    if (splineApp && !hasAnimated.current) {
      animateBrightness();
    }
  }, [splineApp, animateBrightness]);

  function onLoad(spline: Application) {  
    spline.setVariable('mouth', 10);
    spline.setVariable('eyes', 1);
    spline.setVariable('brightness', 0);
    
    setSplineApp(spline);
  }

  return (
    <TarotProvider>
      <main className="relative h-screen w-screen overflow-hidden bg-background">
        <div className="absolute inset-0">
          <Spline
            scene="/spline/scene.splinecode"
            onLoad={onLoad}
          />
        </div>

        <TarotSpread />
        <VoiceInterface splineApp={splineApp} />

        <div className="absolute top-4 left-4 text-foreground">
          <h1 className="text-2xl font-bold">Phantom Cartomancer</h1>
          <p className="text-sm opacity-70">Speak to begin your reading...</p>
        </div>
      </main>
    </TarotProvider>
  );
}
