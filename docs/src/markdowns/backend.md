# Backend API & Infrastructure

The backend is built using Node.js and the **Hono** framework. It acts as the secure middle layer between the frontend clients and the LiveKit infrastructure.

## Core Responsibilities

1. **Authentication & Token Generation**: Validates doctor/patient JWTs and issues short-lived LiveKit access tokens.
2. **Room Management**: Calls the LiveKit Server SDK to provision rooms on-demand.
3. **Webhook Ingestion**: Receives `room.finished` and `egress.ended` webhooks from LiveKit to trigger post-processing.
4. **Job Queuing**: Dispatches AI processing tasks to **BullMQ**.

## API Endpoints

### `POST /call/create`
Creates a new room. Requires a Doctor JWT.
* **Returns**: `roomId`, `callId`, and the Doctor's LiveKit token.

### `POST /call/join`
Allows a participant to join an existing room. 
* **Returns**: LiveKit token scoped for joining only.

### `GET /call/{id}/results`
Fetches the processing status and final AI results.
* **Returns**: JSON containing `status` (pending, active, processing, completed), `transcript`, and `aiSummary`.
