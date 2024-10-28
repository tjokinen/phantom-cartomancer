"use client";

import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { useState } from 'react';
import VoiceInterface from '@/components/audio/VoiceInterface';

export default function Home() {
  const [splineApp, setSplineApp] = useState<Application | null>(null);

  function onLoad(spline: Application) {
    setSplineApp(spline);
    // You might want to initialize any specific Spline animations or states here
  }

  // This function could be used to animate the character's mouth when speaking
  function animateMouth(value: number) {
    if (splineApp) {
      splineApp.setVariable('mouth', value);
    }
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Spline Scene */}
      <div className="absolute inset-0">
        <Spline
          scene="https://prod.spline.design/sl6QkZ6MpZcE3Ofc/scene.splinecode"
          onLoad={onLoad}
        />
      </div>

      {/* Voice Interface */}
      <VoiceInterface />

      {/* Optional: Add any UI overlays or additional components here */}
      <div className="absolute top-4 left-4 text-foreground">
        <h1 className="text-2xl font-bold">Phantom Cartomancer</h1>
        <p className="text-sm opacity-70">Speak to begin your reading...</p>
      </div>
    </main>
  );
}
