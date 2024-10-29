import { OpenAI } from 'openai';
import { env } from '@/lib/env';
import { PHANTOM_CARTOMANCER_PROMPT } from '@/lib/openai';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || '',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  try {
    const data = await req.arrayBuffer();
    
    // Convert ArrayBuffer to File
    const audioFile = new File(
      [data], 
      'audio.webm', 
      { type: 'audio/webm;codecs=opus' }
    );
    
    // Convert to text using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: PHANTOM_CARTOMANCER_PROMPT },
        { role: 'user', content: transcription.text },
      ],
    });

    // Convert to speech
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: completion.choices[0].message.content || '',
    });

    // Send response
    await writer.write(encoder.encode(JSON.stringify({
      transcription: transcription.text,
      response: completion.choices[0].message.content,
      audio: await speech.arrayBuffer(),
    })));
  } catch (error) {
    console.error('Processing error:', error);
    await writer.write(encoder.encode(JSON.stringify({ 
      error: 'Processing error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })));
  } finally {
    await writer.close();
  }

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}