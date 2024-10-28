"use client";

import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { useState } from 'react';
import VoiceInterface from '@/components/audio/VoiceInterface';

export default function Home() {
  const [splineApp, setSplineApp] = useState<Application | null>(null);

  function onLoad(spline: Application) {
    setSplineApp(spline);
    // Initialize mouth to closed position
    spline.setVariable('mouth', 10);
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <Spline
          scene="https://prod.spline.design/sl6QkZ6MpZcE3Ofc/scene.splinecode"
          onLoad={onLoad}
        />
      </div>

      <VoiceInterface splineApp={splineApp} />

      <div className="absolute top-4 left-4 text-foreground">
        <h1 className="text-2xl font-bold">Phantom Cartomancer</h1>
        <p className="text-sm opacity-70">Speak to begin your reading...</p>
      </div>
    </main>
  );
}
