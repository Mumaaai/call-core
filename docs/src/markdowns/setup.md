# Initial Setup & Groundwork

This document outlines the foundational work completed to establish the **Call Core Platform** based on the original Product Requirements Document (PRD).

## Monorepo Structure

The project has been initialized as an npm workspace-based monorepo. The core directories are organized as follows:

- `packages/call-core/`: A shared TypeScript library wrapping the LiveKit SDK. It acts as the central interface for all real-time communication needs across different frontend clients.
- `apps/api/`: A Node.js backend using the Hono framework. It provides a lightweight API for authentication, Room management, webhook ingestion, and job queuing.
- `apps/worker/`: A dedicated asynchronous worker built on Node.js. It consumes from a BullMQ queue, extracts audio using FFmpeg, generates Whisper transcripts, and performs LLM analysis.
- `apps/web/`: A frontend web application initialized with Vite (React + TypeScript). 
- `apps/mobile/`: A frontend mobile application initialized with Expo (React Native + TypeScript).
- `tasks/`: Contains a set of markdown files representing individual actionable checklists to complete the various phases of development.

## Setup Steps Completed

1. **Root Configuration**: Established a top-level `package.json` that hooks together the `apps/` and `packages/` folders using standard npm workspaces.
2. **Library Configuration (`call-core`)**: Installed `livekit-client` and initialized a basic TypeScript `src/index.ts` entry point.
3. **Backend Scaffolding (`api` & `worker`)**: Bootstrapped basic application shells. The `api` exposes a minimal Hono server, and the `worker` registers a BullMQ consumer instance.
4. **Frontend Generation (`web` & `mobile`)**: Utilized `create-vite` and `create-expo-app` to scaffold complete, running baseline structures for both UI platforms.
5. **Ignore File**: Added a base `.gitignore` to prevent committing `node_modules`.

## Next Steps

With the project skeleton properly mapped out, the next phase of development focuses on executing the items outlined in the `tasks/` directory, starting with building out the `call-core` LiveKit connection logics and provisioning the underlying infrastructure.
