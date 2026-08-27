// Transcribes uploaded interview audio using Google Cloud Speech-to-Text
import speech from '@google-cloud/speech';
import fs from 'fs';

const keyPath = process.env.GCP_KEY_FILE;

if (!keyPath) {
    throw new Error('GCP_KEY_FILE is not configured');
}

const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const client = new speech.SpeechClient({
    projectId: credentials.project_id,
    credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
    }
});

export const transcribeAudio = async (audioUrl) => {
    const gcsUri = audioUrl.replace('https://storage.googleapis.com/', 'gs://');

    console.log('Transcribing audio:', gcsUri);

    const request = {
        audio: { uri: gcsUri },
        config: {
            encoding: 'MP3',
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            model: 'latest_long'
        }
    };

    try {
        const [response] = await client.recognize(request);

        const transcript = response.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join(' ')
            .trim();

        const confidence = response.results?.length
            ? response.results[0].alternatives[0].confidence
            : 0;

        return {
            text: transcript || '(no speech detected)',
            language: 'en-US',
            confidence,
            wordCount: transcript ? transcript.split(/\s+/).length : 0
        };

    } catch (error) {
        console.error('GCP Speech-to-Text Error:', error.message);
        throw new Error(`GCP Transcription failed: ${error.message}`);
    }
};