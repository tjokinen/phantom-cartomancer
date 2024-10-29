import { OpenAI } from 'openai';
import { env } from '@/lib/env';
import { tarotFunctions } from '@/lib/tarot/functions';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio');
    const messagesJson = formData.get('messages');
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      return Response.json(
        { error: 'OpenAI API key not provided' },
        { status: 401 }
      );
    }

    let openai: OpenAI;
    try {
      openai = new OpenAI({
        apiKey: apiKey,
      });
    } catch (error) {
      return Response.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    req.headers.delete('x-api-key');

    const messages = messagesJson ? JSON.parse(messagesJson as string) : [];

    if (!audioBlob || !(audioBlob instanceof Blob)) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: 'audio/webm' 
    });

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });

      const fullMessages = [
        ...messages,
        { role: 'user', content: transcription.text }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: fullMessages,
        functions: tarotFunctions,
        function_call: 'auto',
      });

      const message = completion.choices[0].message;
      let spokenResponse = message.content || '';
      const functionCalls = [];

      // Handle function calls
      if (message.function_call) {
        functionCalls.push(message.function_call);
        
        const followUp = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            ...messages,
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
      const sanitizedError = error instanceof Error 
        ? error.message.replace(apiKey, '[REDACTED]')
        : 'Unknown error';
      
      console.error('Processing error:', sanitizedError);
      return Response.json(
        { error: 'Processing error occurred' },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      { error: 'Request processing failed' },
      { status: 500 }
    );
  }
}
