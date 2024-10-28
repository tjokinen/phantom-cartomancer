import { OpenAI } from 'openai';
import { PHANTOM_CARTOMANCER_PROMPT } from '@/lib/openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio');

    if (!audioBlob || !(audioBlob instanceof Blob)) {
      console.error('Invalid audio data received');
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    console.log('Audio blob size:', audioBlob.size);
    console.log('Audio blob type:', audioBlob.type);

    // Convert Blob to File with explicit type
    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: 'audio/webm' // Simplified MIME type
    });

    console.log('Starting Whisper transcription...');
    // Process with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'json',
    });

    console.log('Transcription received:', transcription.text);

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: PHANTOM_CARTOMANCER_PROMPT },
        { role: 'user', content: transcription.text },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    console.log('GPT response received');

    // Generate speech
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: completion.choices[0].message.content || '',
    });

    console.log('Speech generated');

    // Convert the audio buffer to base64
    const audioBuffer = await speech.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return new Response(JSON.stringify({
      type: 'completion',
      transcription: transcription.text,
      response: completion.choices[0].message.content,
      audio: audioBase64
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Detailed error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
