'use client';

import { useEffect, useRef, useState } from 'react';

export default function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startListening = async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext();
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      
      // Clear previous chunks
      chunksRef.current = [];

      // Set up MediaRecorder with audio stream
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });

      // Handle audio data chunks
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorderRef.current.onstop = async () => {
        try {
          // Combine all chunks into a single blob
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // Convert webm to mp3
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Create WAV blob
          const wavBlob = await convertToWav(audioBuffer);
          
          console.log('Sending audio file, size:', wavBlob.size);
          
          const formData = new FormData();
          formData.append('audio', wavBlob, 'audio.wav');
          
          const response = await fetch('/api/audio/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server error: ${errorData.error || response.statusText}`);
          }

          const data = await response.json();
          console.log('Server response:', data);

          if (data.audio) {
            const audioBuffer = await audioContextRef.current!.decodeAudioData(data.audio);
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current!.destination);
            source.start();
          }
        } catch (error) {
          console.error('Detailed error processing audio:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
      };

      mediaRecorderRef.current.start(1000); // Collect chunks every second
      setIsListening(true);
    } catch (err) {
      console.error('Error starting audio:', err);
      setError('Failed to start audio capture');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  // Helper function to convert AudioBuffer to WAV
  const convertToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChannels, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const data = new Float32Array(audioBuffer.length * numOfChannels);
    let offset = 44;
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      data.set(audioBuffer.getChannelData(i), audioBuffer.length * i);
    }
    
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const writeUTFBytes = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
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