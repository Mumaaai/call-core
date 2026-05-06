# Task 3: Processing Worker & AI Integration

## Objective
Create the asynchronous worker that handles audio extraction, Whisper transcription, and LLM analysis.

## Prerequisites
- Task 2 Backend API & Queue setup
- OpenAI API Key (for Whisper and GPT/Claude)
- FFmpeg installed in the worker environment

## Tasks
- [ ] Initialize `apps/worker` with Node.js (or Python).
- [ ] Set up BullMQ Consumer to listen to `processingQueue`.
- [ ] Implement Step 1: Download Recording
  - Read S3 object path from job data
  - Download recording to local temporary storage
- [ ] Implement Step 2: Audio Extraction
  - Run FFmpeg to extract 16kHz mono WAV: `ffmpeg -i input.mp4 -ar 16000 -ac 1 -c:a pcm_s16le output.wav`
- [ ] Implement Step 3: Transcription
  - Send `output.wav` to OpenAI Whisper API
  - Receive transcript with word-level timestamps
- [ ] Implement Step 4: LLM Analysis
  - Define the versioned Prompt schema for Clinical Summary
  - Send transcript to Claude/GPT-4o API to extract structured JSON (summary, symptoms, assessments, medications, follow-ups)
- [ ] Implement Step 5: Database Update
  - Write outputs to the `Call` record in database
  - Update call status to `completed`
  - Delete temporary files (on success and failure)
- [ ] Add Retry and Dead-Letter Queue Logic:
  - Ensure operations are idempotent (don't re-transcribe if failed at LLM step)
  - Configure 3 retries with exponential backoff
  - Handle `processing_failed` state updates.
