'use client';

import { useState } from 'react';
import { useApiKey } from '@/lib/context/ApiKeyContext';

export default function ApiKeyInput() {
  const { setApiKey } = useApiKey();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.startsWith('sk-')) {
      setError('Please enter a valid OpenAI API key starting with "sk-"');
      return;
    }
    setApiKey(inputKey);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
      <div className="max-w-md w-full px-6">
        <h2 className="text-2xl text-purple-200/90 font-serif text-center mb-6">
          Enter Your OpenAI API Key
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              placeholder="sk-..."
              className="w-full px-4 py-2 bg-purple-900/20 border border-purple-300/30 
                rounded-lg text-purple-200/90 placeholder-purple-200/50
                focus:outline-none focus:border-purple-300/50"
            />
            {error && (
              <p className="mt-2 text-red-400 text-sm">{error}</p>
            )}
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="px-6 py-2 bg-purple-500/20 border border-purple-300/30 
                rounded-lg text-purple-200/90 hover:bg-purple-500/30 
                transition-colors duration-200"
            >
              Begin Your Reading
            </button>
          </div>
        </form>
        <p className="mt-4 text-purple-200/50 text-sm text-center">
          Your API key is stored locally and never saved on our servers. However, it's recommended to create a temporary key and delete it after use for security reasons.
        </p>
      </div>
    </div>
  );
}
