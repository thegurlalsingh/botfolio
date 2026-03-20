# video_to_audio.py - using ffmpeg-python
import sys
import ffmpeg

def extract_audio(video_path, audio_path):
    try:
        stream = ffmpeg.input(video_path)
        stream = ffmpeg.output(stream, audio_path, format='mp3', acodec='libmp3lame', loglevel='error')
        ffmpeg.run(stream)
        print(f"Audio extracted successfully to {audio_path}")
    except ffmpeg.Error as e:
        print(f"ffmpeg error: {e.stderr.decode()}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python video_to_audio.py <video_path> <audio_path>", file=sys.stderr)
        sys.exit(1)
    
    extract_audio(sys.argv[1], sys.argv[2])