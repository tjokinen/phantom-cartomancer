import { OpenAI } from 'openai';
import { PHANTOM_CARTOMANCER_PROMPT } from '@/lib/openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Send initial connection message
  await writer.write(encoder.encode('data: {"type":"connected"}\n\n'));

  // Keep the connection alive with heartbeats
  const interval = setInterval(async () => {
    try {
      await writer.write(encoder.encode('data: heartbeat\n\n'));
    } catch (error) {
      clearInterval(interval);
    }
  }, 15000);

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 