import { OpenAI } from 'openai';
import { PHANTOM_CARTOMANCER_PROMPT } from '@/lib/openai';
import { tarotFunctions } from '@/lib/tarot/functions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio');

    if (!audioBlob || !(audioBlob instanceof Blob)) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: 'audio/webm' 
    });

    // Process with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    // Get AI response with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: PHANTOM_CARTOMANCER_PROMPT },
        { role: 'user', content: transcription.text }
      ],
      functions: tarotFunctions,
      function_call: 'auto',
    });

    const message = completion.choices[0].message;
    let spokenResponse = message.content || '';
    const functionCalls = [];

    // Handle function calls
    if (message.function_call) {
      // If it's a single function call
      functionCalls.push(message.function_call);
      
      // Get a follow-up response that includes the interpretation
      const followUp = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: PHANTOM_CARTOMANCER_PROMPT },
          { role: 'user', content: transcription.text },
          message,
          { 
            role: 'system', 
            content: 'Now provide the interpretation of the cards without any function calls.' 
          }
        ]
      });

      spokenResponse = followUp.choices[0].message.content || '';
    }

    // Generate speech from the cleaned response
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: spokenResponse,
    });

    const audioBuffer = await speech.arrayBuffer();

    return Response.json({
      type: 'completion',
      transcription: transcription.text,
      response: spokenResponse,
      functionCalls: functionCalls,
      audio: Buffer.from(audioBuffer).toString('base64')
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
