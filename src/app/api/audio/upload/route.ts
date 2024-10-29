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

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('\n=== Raw Messages JSON ===');
    console.log('messagesJson:', messagesJson);

    const messages = messagesJson ? JSON.parse(messagesJson as string) : [];
    console.log('\n=== Parsed Messages ===');
    console.log('messages:', JSON.stringify(messages, null, 2));

    if (!audioBlob || !(audioBlob instanceof Blob)) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: 'audio/webm' 
    });

    // Log transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    console.log('\n=== New Transcription ===');
    console.log('User said:', transcription.text);

    // Log full message array being sent to OpenAI
    const fullMessages = [
      ...messages,
      { role: 'user', content: transcription.text }
    ];
    console.log('\n=== Sending to OpenAI ===');
    console.log('Complete message array:', JSON.stringify(fullMessages, null, 2));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: fullMessages,
      functions: tarotFunctions,
      function_call: 'auto',
    });

    // Log OpenAI's response
    console.log('\n=== OpenAI Response ===');
    console.log('AI response:', JSON.stringify(completion.choices[0], null, 2));
    console.log('================\n');

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
