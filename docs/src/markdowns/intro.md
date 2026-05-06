# Introduction to Call Core

Welcome to the **Mumaa Call Core Platform** documentation.

This platform provides a foundational 1:1 video consultation service tailored for doctor-patient interactions. It guarantees stable real-time communication, robust server-side recording, and post-call AI analysis.

## Key Goals

* **Reliable 1:1 Video Calls**: Seamless WebRTC infrastructure using LiveKit, ensuring <2s join latency and adaptive bitrates for poor network conditions.
* **Server-Side Recording**: Every session is recorded automatically via LiveKit Egress without requiring client-side uploads. 
* **Whisper Transcription**: Recordings are securely passed to OpenAI Whisper to generate a highly accurate (>90%) transcript.
* **Clinical Summaries**: Transcripts are synthesized by Claude/GPT-4o to extract symptoms, diagnoses, medications, and follow-up actions into structured JSON.

## Architecture Overview

The system is broken down into modular components:
1. **Frontend SDK (`call-core`)**: Wraps the LiveKit SDK, handling connection state and room lifecycle.
2. **API Backend**: Node.js + Hono server for token generation, room management, and queue dispatching.
3. **Processing Worker**: Consumes finished calls from BullMQ, downloads S3 recordings, extracts audio using FFmpeg, and runs the AI pipeline.
