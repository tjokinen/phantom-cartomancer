'use client';

import { useApiKey } from '@/lib/context/ApiKeyContext';
import ApiKeyInput from './ApiKeyInput';

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const { isKeySet } = useApiKey();

  if (!isKeySet) {
    return <ApiKeyInput />;
  }

  return <>{children}</>;
} 