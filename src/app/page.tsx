"use client";

import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { useState, useCallback, useEffect, useRef } from 'react';
import VoiceInterface from '@/components/audio/VoiceInterface';
import TarotSpread from '@/components/tarot/TarotSpread';
import { TarotProvider } from '@/lib/context/TarotContext';

export default function Home() {
  const [splineApp, setSplineApp] = useState<Application | null>(null);
  const [showStartButton, setShowStartButton] = useState(true);
  const hasAnimated = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const animationFrameId = useRef<number>();

  const updateMouthMovement = useCallback(() => {
    if (!analyserNode.current || !splineApp) return;

    const dataArray = new Uint8Array(analyserNode.current.frequencyBinCount);
    analyserNode.current.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    const average = sum / dataArray.length;
    
    const mouthValue = 10 + (average * 1.5);
    const clampedValue = Math.min(200, Math.max(10, mouthValue));
    
    splineApp.setVariable('mouth', clampedValue);
    animationFrameId.current = requestAnimationFrame(updateMouthMovement);
  }, [splineApp]);

  const playIntroduction = useCallback(async () => {
    try {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      if (!audioElement.current) {
        audioElement.current = new Audio('/audio/introduction.mp3');
        const source = audioContext.current.createMediaElementSource(audioElement.current);
        analyserNode.current = audioContext.current.createAnalyser();
        analyserNode.current.fftSize = 256;
        
        source.connect(analyserNode.current);
        analyserNode.current.connect(audioContext.current.destination);
      }

      // Reset audio to start
      audioElement.current.currentTime = 0;
      
      await audioElement.current.play();
      updateMouthMovement();

      // Reset mouth when audio ends
      audioElement.current.onended = () => {
        if (splineApp) {
          splineApp.setVariable('mouth', 10);
        }
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    } catch (error) {
      console.error('Failed to play introduction:', error);
    }
  }, [splineApp, updateMouthMovement]);

  const animateBrightness = useCallback(() => {
    if (!splineApp || hasAnimated.current) return;
    
    hasAnimated.current = true;
    const startTime = Date.now();
    const duration = 5000;

    const animate = () => {
      const currentTime = Date.now() - startTime;
      const progress = Math.min(currentTime / duration, 1);
      
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const brightness = easeOutProgress * 70;
      
      splineApp.setVariable('brightness', brightness);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Play introduction when brightness animation completes
        playIntroduction();
      }
    };

    animate();
  }, [splineApp, playIntroduction]);

  const handleStart = () => {
    setShowStartButton(false);
    animateBrightness();
  };

  function onLoad(spline: Application) {
    console.log('Spline loaded');
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

        {showStartButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <button
              onClick={handleStart}
              className="px-8 py-4 text-xl font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Enter the Ethereal Realm
            </button>
          </div>
        )}

        <div className="absolute top-4 left-4 text-foreground">
          <h1 className="text-2xl font-bold">Phantom Cartomancer</h1>
          <p className="text-sm opacity-70">Speak to begin your reading...</p>
        </div>
      </main>
    </TarotProvider>
  );
}
