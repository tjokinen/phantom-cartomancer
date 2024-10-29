'use client';

import { useEffect, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';
import { useTarot } from '@/lib/context/TarotContext';

interface VoiceInterfaceProps {
  splineApp: Application | null;
  stopIntroAudio?: () => void;
}

export default function VoiceInterface({ splineApp, stopIntroAudio }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string>('');
  const [revealedText, setRevealedText] = useState('');
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

  useEffect(() => {
    if (splineApp) {
      splineApp.setVariable('eyes', isThinking ? 0.2 : 1);
    }
  }, [isThinking, splineApp]);

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
      // Stop introduction audio if it's playing
      stopIntroAudio?.();

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
          setIsThinking(true);
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('messages', JSON.stringify(messages));

          const response = await fetch('/api/audio/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

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
          setIsThinking(false);
        } catch (error) {
          console.error('Detailed error processing audio:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
          setIsThinking(false);
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

  // Get the latest AI message for subtitles
  const latestAIMessage = messages.filter(msg => msg.role === 'assistant').slice(-1)[0]?.content;

  // Gradually reveal the AI message
  useEffect(() => {
    if (!latestAIMessage) return;

    let index = 0;
    const interval = setInterval(() => {
      setRevealedText(latestAIMessage.slice(0, index));
      index++;
      if (index > latestAIMessage.length) {
        clearInterval(interval);
      }
    }, 50); // Adjust the speed of text reveal here

    return () => clearInterval(interval);
  }, [latestAIMessage]);

  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
      {/* Thinking state overlay */}
      {isThinking && (
        <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 w-64 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-purple-200/80 font-serif text-sm">
              Divining your message...
            </p>
            <p className="text-purple-200/50 text-xs italic">
              The spirits are contemplating
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`group relative flex flex-col items-center ${isThinking ? 'opacity-50 cursor-wait' : ''}`}
          disabled={isThinking}
        >
          {/* Hover instruction - changes based on listening state */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className={`${isListening ? 'text-red-200/60' : 'text-purple-200/60'} text-sm italic text-center`}>
              {isListening ? 'Click to stop recording' : 'Click to commune'}
            </p>
          </div>

          {/* Main button circle */}
          <div className="relative">
            <div className={`w-16 h-16 rounded-full 
              ${isListening 
                ? 'bg-gradient-to-br from-red-400/30 to-red-800/50 border-red-300/30' 
                : 'bg-gradient-to-br from-purple-400/20 to-purple-800/40 border-purple-300/30'
              } 
              border backdrop-blur-sm flex items-center justify-center
              transition-all duration-300 group-hover:scale-110`}
            >
              {/* Recording indicator pulse */}
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
              
              {/* Animated rings */}
              <div className={`absolute inset-0 rounded-full 
                ${isListening 
                  ? 'border-2 border-red-300/30 animate-pulse' 
                  : 'border-2 border-purple-300/30 animate-pulse'
                }`} 
              />
              
              {/* Down arrow for non-listening state */}
              {!isListening && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg 
                    className="w-4 h-4 text-purple-200/70" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                </div>
              )}
              
              {/* Main icon */}
              <svg 
                className={`w-8 h-8 
                  ${isListening 
                    ? 'text-red-200/70' 
                    : 'text-purple-200/70'
                  } 
                  transition-colors duration-300`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isListening ? (
                  // Stop icon
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M16 12H8"
                  />
                ) : (
                  // Mystical ear/listening icon
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M12 6v12m0-12c-3.3 0-6 2.7-6 6s2.7 6 6 6m0-12c3.3 0 6 2.7 6 6s-2.7 6-6 6m-6-6h12"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Button text */}
          <div className="flex flex-col items-center space-y-1">
            <span className={`mt-2 font-serif text-sm 
              ${isListening 
                ? 'text-red-200/80' 
                : 'text-purple-200/80'
              } 
              tracking-wide`}
            >
              {isListening ? 'Seal the Veil' : 'Speak to the Spirit'}
            </span>
            <span className={`text-xs italic ${isListening ? 'text-red-200/50' : 'text-purple-200/50'}`}>
              {isListening ? 'Recording... Click to stop' : 'Press to begin'}
            </span>
          </div>
        </button>

        {/* Error message */}
        {error && (
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-48 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Subtitles for AI response */}
      {revealedText && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 w-3/4 max-h-20 overflow-y-auto bg-black/70 p-2 rounded-md">
          <p className="text-purple-200/80 font-serif text-xs leading-tight">
            {revealedText}
          </p>
        </div>
      )}
    </div>
  );
} 