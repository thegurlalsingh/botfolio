import dotenv from 'dotenv';

dotenv.config({
    path: '../../../.env'
});

console.log("GCP_KEY_FILE:", process.env.GCP_KEY_FILE);
console.log("GCP_PROJECT_ID:", process.env.GCP_PROJECT_ID);

const { transcribeAudio } = await import('./transcribe.js');

const audioUri =
    'gs://ai-interview-resumes/audios/16d2584d-744b-428f-af07-3e235cc82c21_1787733152608.mp3';

try {
    const transcript = await transcribeAudio(audioUri);

    console.log('\n======================');
    console.log('TRANSCRIPT:');
    console.log(transcript);
    console.log('======================');

} catch (error) {
    console.error('Transcription failed:');
    console.error(error);
}