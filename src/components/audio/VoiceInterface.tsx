'use client';

import { useEffect, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';
import { useTarot } from '@/lib/context/TarotContext';

interface VoiceInterfaceProps {
  splineApp: Application | null;
}

export default function VoiceInterface({ splineApp }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const { 
    addCard, 
    revealCard, 
    clearCards, 
    messages,
    addMessage 
  } = useTarot();
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext on component mount
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const updateMouth = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    const average = sum / dataArray.length;
    
    const mouthValue = 10 + (average * 1.5);
    const clampedValue = Math.min(200, Math.max(10, mouthValue));
    
    if (splineApp) {
      splineApp.setVariable('mouth', clampedValue);
    }

    animationFrameRef.current = requestAnimationFrame(() => updateMouth(analyser));
  };

  const stopCurrentAudio = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop();
      currentAudioSourceRef.current.disconnect();
      currentAudioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (splineApp) {
      splineApp.setVariable('mouth', 10); // Reset mouth to closed position
    }
  };

  const startListening = async () => {
    try {
      // Stop any playing audio first
      stopCurrentAudio();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      
      chunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);
          
          // Log messages before sending
          console.log('Sending messages:', messages);
          formData.append('messages', JSON.stringify(messages));

          const response = await fetch('/api/audio/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          console.log('Response from server:', data);

          if (data.transcription) {
            // Store user's message
            addMessage({ 
              role: 'user', 
              content: data.transcription 
            });
          }

          if (data.response) {
            // Store AI's response
            addMessage({ 
              role: 'assistant', 
              content: data.response,
              function_call: data.functionCalls?.[0] 
            });
          }

          // Log updated messages
          console.log('Updated messages:', messages);

          if (data.functionCalls) {
            handleFunctionCalls(data.functionCalls);
          }

          if (data.audio && audioContextRef.current) {
            const binaryString = window.atob(data.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            
            startMouthAnimation(source);
            source.start();
          }
        } catch (error) {
          console.error('Detailed error processing audio:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsListening(true);
    } catch (err) {
      console.error('Error starting audio:', err);
      setError('Failed to start audio capture');
    }
  };

  const stopListening = () => {
    stopCurrentAudio();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const startMouthAnimation = (source: AudioBufferSourceNode) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    // Store the current audio source for potential stopping
    currentAudioSourceRef.current = source;

    // Connect source to both analyser and destination
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    updateMouth(analyserRef.current);

    source.onended = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (splineApp) {
        splineApp.setVariable('mouth', 10);
      }
      // Disconnect nodes when audio ends
      source.disconnect();
      analyserRef.current?.disconnect();
      currentAudioSourceRef.current = null;
    };
  };

  const handleFunctionCalls = (functionCalls: any[]) => {
    functionCalls.forEach(functionCall => {
      try {
        const args = JSON.parse(functionCall.arguments);
        
        switch (functionCall.name) {
          case 'drawCard':
            addCard(args.cardName, args.position || 'upright');
            break;
          case 'revealCard':
            revealCard(args.index);
            break;
          case 'clearCards':
            clearCards();
            break;
        }
      } catch (error) {
        console.error('Error processing function call:', error);
      }
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-slate-800 rounded-lg shadow-lg">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`px-4 py-2 rounded-full ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors`}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
    </div>
  );
} 