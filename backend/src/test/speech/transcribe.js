import speech from '@google-cloud/speech';
import fs from 'fs';

const keyPath = process.env.GCP_KEY_FILE;

console.log("Key path:", keyPath);
console.log("Key exists:", fs.existsSync(keyPath));

const credentials = JSON.parse(
    fs.readFileSync(keyPath, 'utf8')
);

console.log("Service account:", credentials.client_email);
console.log("Project:", credentials.project_id);

const client = new speech.SpeechClient({
    projectId: credentials.project_id,
    credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
    }
});

export const transcribeAudio = async (gcsUri) => {

    console.log("Transcribing:", gcsUri);

    const request = {
        audio: {
            uri: gcsUri
        },
        config: {
            encoding: 'MP3',
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            model: 'latest_long'
        }
    };

    const [response] = await client.recognize(request);

    const transcript = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(' ')
        .trim();

    return transcript || '(no speech detected)';
};