# Processing Worker (AI Pipeline)

The processing worker is an isolated Node.js application that listens to **BullMQ** for completed video calls and executes a multi-step AI pipeline.

## Pipeline Steps

1. **Download Recording**: Retrieves the raw `.mp4` recording from the S3 bucket via signed URL.
2. **Audio Extraction**: Uses `ffmpeg` to extract a 16kHz mono `.wav` file, optimizing it for Whisper.
   ```bash
   ffmpeg -i input.mp4 -ar 16000 -ac 1 -c:a pcm_s16le output.wav
   ```
3. **Transcription**: Uploads the `.wav` to the OpenAI Whisper API to generate a complete text transcript with timestamps.
4. **LLM Analysis**: Prompts Claude or GPT-4o with the transcript to generate a structured clinical summary (symptoms, medications, follow-ups).
5. **Database Update**: Persists the summary to the database and marks the call as `completed`.

## Resilience & Retries

The worker ensures idempotency. If an API call fails (e.g. OpenAI rate limit), the job is retried with exponential backoff up to 3 times before moving to a dead-letter queue.
