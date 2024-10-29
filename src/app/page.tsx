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
        {!showStartButton && <VoiceInterface splineApp={splineApp} />}

        {showStartButton && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div 
              className="relative group cursor-pointer"
              onClick={handleStart}
            >
              <div className="absolute inset-0 rounded-full border-2 border-purple-300/30 animate-pulse" />
              
              <div className="relative p-8 text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/20 to-purple-800/40 backdrop-blur-sm 
                              border border-purple-300/30 flex items-center justify-center
                              group-hover:from-purple-400/30 group-hover:to-purple-800/50 
                              transition-all duration-500 shadow-lg shadow-purple-500/20">
                  <div className="absolute inset-0 rounded-full bg-purple-500/5 animate-ping" />
                  <div className="absolute inset-0 rounded-full border border-purple-300/20 animate-pulse" />
                  
                  {/* Ornate Mystical Symbol */}
                  <svg 
                    className="w-16 h-16 text-purple-200/70 group-hover:text-purple-200/90 transition-colors duration-300" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 2l2.4 2.4L12 7.2 9.6 4.4z" />
                    <path d="M12 16.8l2.4 2.4L12 21.6l-2.4-2.4z" />
                    <path d="M21.6 12l-2.4 2.4-2.4-2.4 2.4-2.4z" />
                    <path d="M7.2 12l-2.4 2.4L2.4 12l2.4-2.4z" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 6l1.5 1.5L12 9l-1.5-1.5z" />
                    <path d="M12 15l1.5 1.5L12 18l-1.5-1.5z" />
                    <path d="M15 12l1.5 1.5L18 12l-1.5-1.5z" />
                    <path d="M6 12l1.5 1.5L9 12 7.5 10.5z" />
                  </svg>
                </div>
              </div>

              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-64 text-center">
                <p className="text-purple-200/80 font-serif text-lg">
                  Pierce the Veil
                </p>
                <p className="text-purple-300/50 font-serif text-sm mt-2 italic">
                  {"And step into the ethereal realm..."}
                </p>
              </div>
            </div>
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
