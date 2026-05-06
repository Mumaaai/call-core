# Call Core Platform

This repository is a monorepo for a 1:1 video consultation platform built specifically for doctor-patient sessions. The system handles real-time video communication, server-side call recording, audio transcription, and AI-generated post-call analysis.

## System Architecture

The project consists of the following components:

- **`packages/call-core`**: A shared SDK wrapping LiveKit for use in Web and React Native clients.
- **`apps/api`**: A Node.js API backend responsible for room creation, authentication, webhook ingestion, and queuing.
- **`apps/worker`**: An asynchronous Node.js/Python worker that handles downloading recordings, extracting audio via FFmpeg, transcribing via OpenAI Whisper, and generating clinical summaries via Claude/GPT-4o.
- **`apps/web`**: The web client built in React + TypeScript.
- **`apps/mobile`**: The mobile client built in React Native.

## Getting Started

To run the entire platform locally, including the frontend application and the documentation server simultaneously, simply run:

```bash
npm install
npm run dev
```

This will spin up:
- The **Web App** (landing portal) at `http://localhost:5173`
- The **Documentation Server** at `http://localhost:5174` (or whatever available port Vite chooses next)

## Development Tasks

The implementation plan is split into manageable phases. Please refer to the `tasks/` directory for detailed task checklists:

- [Task 1: Shared SDK (`call-core`) and Infrastructure Setup](./tasks/01-call-core-sdk.md)
- [Task 2: Backend API & Database Setup](./tasks/02-backend-api.md)
- [Task 3: Processing Worker & AI Integration](./tasks/03-processing-worker.md)
- [Task 4: Frontend Apps (Web & Mobile)](./tasks/04-frontend.md)

## Reference Document

For complete architectural details, goals, edge cases, and API specifications, please review the [call-core-plan.md](./call-core-plan.md).
