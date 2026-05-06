# Product Requirements Document: Video Consultation with Recording and AI Processing

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** May 2026  
**Author:** Sumit Srivastava
---

## 1. Overview

This document describes the requirements and design for a 1:1 video consultation platform built specifically for doctor-patient sessions. The system must handle real-time video communication, server-side call recording, audio transcription, and AI-generated post-call analysis — all within a single, coherent pipeline.

The product will be delivered as a web application (React) and a React Native mobile application sharing a common call logic package. The backend is a Node.js API server paired with an asynchronous processing worker. LiveKit is chosen as the WebRTC infrastructure layer for its reliable SFU architecture, built-in server-side recording, and SDKs for both web and mobile targets.

This is a foundational feature of the product. The entire doctor-patient workflow depends on it working correctly. It must be stable under real-world network conditions, degrade gracefully when components fail, and be auditable after the fact.

---

## 2. Goals

### 2.1 Primary Goals

- Enable reliable 1:1 video calls between a doctor and a patient on both web and mobile.
- Record every call automatically on the server, without any action required from either participant.
- Produce a full text transcript of each call after it ends.
- Generate an AI-produced summary and structured clinical insights from the transcript.

### 2.2 Secondary Goals

- Call join latency below 2 seconds under normal network conditions.
- End-to-end processing time (from call end to results available) below 3 minutes.
- Recording success rate above 99% of completed calls.
- Call success rate (both participants connected and able to communicate) above 95%.
- Transcription word accuracy above 90% for clearly spoken medical English.
- A modular SDK (`call-core`) that the frontend teams can integrate without coupling to infrastructure details.

---

## 3. Out of Scope for This Release

The following are explicitly deferred. They should not influence architecture decisions for this release, but the system should not make them structurally impossible either.

- Group calls (more than 2 participants).
- Live transcription displayed during the call.
- UI polish beyond functional controls — this release prioritises correctness over aesthetics.
- Multi-language transcription.
- Doctor notes auto-population from the transcript.

---

## 4. System Architecture

The system is composed of five layers that interact in a defined sequence. Each layer has a single primary responsibility.

```
Frontend (Web — React + TypeScript / Mobile — React Native)
    |
    | HTTP (token exchange, result fetching)
    v
Backend API (Node.js)
    |
    | LiveKit SDK (room creation, token generation)
    v
LiveKit Server (SFU + server-side egress recording)
    |
    | Egress → uploads recording to object storage
    v
Object Storage (AWS S3 or GCP bucket)
    |
    | Webhook → backend → job queue
    v
Processing Worker (Node.js or Python)
    |-- FFmpeg: audio extraction from video
    |-- Whisper (OpenAI API or self-hosted): transcription
    |-- LLM (Claude or GPT-4o): summary and insights
    |
    v
Database (call record updated with transcript + AI output)
    |
    v
Frontend fetches results via GET /call/{id}/results
```

There is no direct communication between the frontend and the processing worker. The worker is entirely triggered by the queue. The frontend polls or is notified via a status field on the call record.

---

## 5. Technology Choices and Rationale

### 5.1 Video Layer: LiveKit

LiveKit is an open-source WebRTC SFU with a cloud-hosted option and a self-hostable server. It is chosen over Twilio Video or Daily.co for the following reasons:

- It provides server-side egress recording, meaning the recording is not dependent on either client staying connected or having a reliable upload connection.
- It supports both Web (JS SDK) and React Native via the same conceptual API, reducing the surface area of the `call-core` abstraction.
- Room lifecycle webhooks (room created, participant joined, egress completed) are well-documented and reliable for triggering downstream pipeline steps.
- It handles adaptive bitrate and connection quality natively.

The trade-off is operational complexity if self-hosted. For early stages, LiveKit Cloud is recommended. The architecture does not change if self-hosting is introduced later.

### 5.2 Frontend: React + TypeScript (web), React Native (mobile)

Both platforms share a `call-core` package that wraps the LiveKit client SDK and exposes:

- `joinRoom(token, roomName)` — connects and returns a room object
- `leaveRoom()` — graceful disconnect
- `useParticipants()` — reactive list of current participants
- `useConnectionState()` — reactive call quality / connection state
- Room-level events (participant joined, track published, disconnected)

The UI layer is thin. It consumes `call-core` and renders video tracks, a mute/camera toggle, and an end-call control. No business logic lives in the UI components.

### 5.3 Backend: Node.js + Hono (or Express)

A lightweight API server responsible for:

- Authenticating requests (JWT-based, doctor and patient roles).
- Creating LiveKit rooms and generating participant tokens.
- Receiving and validating LiveKit webhooks.
- Enqueuing processing jobs via BullMQ.
- Serving call results from the database.

The backend does not perform any media processing. It is intentionally thin. BullMQ with Redis is used for the job queue. Redis is already commonly available in Node.js deployments and BullMQ provides job retries, visibility into job state, and concurrency control without significant operational overhead.

### 5.4 Processing Worker

A separate process (can be Node.js or Python, Python preferred if Whisper is run locally). Responsibilities:

1. Consume job from the queue.
2. Download the recording file from object storage.
3. Extract audio using FFmpeg (output: 16kHz mono WAV, which Whisper performs best on).
4. Transcribe using Whisper (OpenAI API recommended for initial release; self-hosted via `faster-whisper` as a cost-optimisation later).
5. Send transcript to the LLM with a structured prompt requesting a clinical summary and key points.
6. Write transcript and AI output back to the call record in the database.
7. Update call status to `completed`.

Each step must be independently retryable. If transcription fails, the job should requeue only the transcription step, not re-download the file.

### 5.5 Transcription: OpenAI Whisper

Whisper `large-v3` via the OpenAI API is the starting point. For a doctor-patient call, audio quality is typically controlled (both parties on headsets or phones in a quiet environment), which means Whisper performs well without significant pre-processing.

If audio quality is poor, a pre-processing step using FFmpeg noise reduction filters can be inserted before Whisper without changing the pipeline contract.

### 5.6 AI Processing: LLM (Claude or GPT-4o)

The transcript is sent to an LLM with a prompt that requests:

- A plain-language summary of the consultation (2–4 sentences).
- A structured list of: symptoms mentioned, diagnoses or assessments, medications discussed, follow-up actions.
- Any red-flag items that the doctor may want to review (optional, model-dependent).

The prompt and output schema are versioned. If the schema changes, old call records retain the schema version they were generated with so results remain interpretable.

### 5.7 Storage: AWS S3 or GCP

LiveKit's egress can push directly to S3 or GCP buckets. Recordings are stored with server-side encryption. Access is via signed URLs with a short expiry (15 minutes), generated on demand by the backend when a client requests playback. Recordings are never publicly accessible.

---

## 6. Core User Flow

### Step 1: Call Setup

1. Doctor opens the patient's appointment and clicks "Start Consultation".
2. Frontend calls `POST /call/create` with `doctorId` and `patientId`.
3. Backend creates a LiveKit room (`roomName: call_{uuid}`), stores a new `Call` record with status `pending`, and returns the `roomId` and a doctor access token.
4. Patient receives a notification (email/SMS, out of scope here) with a join link containing the `roomId`.
5. Patient clicks the link, frontend calls `POST /call/join` with the `roomId`, and receives a patient access token.
6. Both clients connect to the LiveKit room using their respective tokens.

### Step 2: During the Call

- LiveKit handles audio/video streaming between the two participants.
- As soon as both participants have joined and the room is active, the backend starts a LiveKit egress recording job (composite recording to S3, with separate audio tracks if the egress plan supports it).
- Recording start is confirmed via a LiveKit webhook (`egress.started`). If this webhook is not received within 30 seconds of both participants joining, the backend retries the egress start once and alerts.
- The call status is updated to `active`.

### Step 3: Call End

- Either participant clicks "End Call", or the room goes empty.
- LiveKit fires `room.finished` and `egress.ended` webhooks.
- The backend marks the call status as `processing` and enqueues a processing job with the recording URL.

### Step 4: Processing Pipeline

The worker executes the following steps sequentially:

1. Download recording from S3 to local temp storage.
2. Run FFmpeg to extract audio: `ffmpeg -i input.mp4 -ar 16000 -ac 1 -c:a pcm_s16le output.wav`.
3. Send `output.wav` to Whisper API. Receive transcript with word-level timestamps.
4. Send transcript to LLM with the clinical summary prompt. Receive structured JSON.
5. Write both outputs to the `Call` record. Delete local temp files.
6. Update call status to `completed`.

If any step fails, the job is retried with exponential backoff (up to 3 attempts). After 3 failures, the job moves to a dead-letter queue and the call status is set to `processing_failed` so the failure is visible in the UI.

### Step 5: Results

- Frontend polls `GET /call/{id}/results` or receives a push notification (WebSocket or polling interval).
- Results page displays: video playback (via signed URL), full transcript (scrollable), and the AI summary panel.

---

## 7. API Specification

### POST /call/create

Creates a new call room and returns credentials for the doctor.

**Request body:**
```json
{
  "doctorId": "string",
  "patientId": "string",
  "scheduledAt": "ISO8601 timestamp (optional)"
}
```

**Response:**
```json
{
  "callId": "string",
  "roomName": "string",
  "token": "string (LiveKit JWT for doctor)"
}
```

---

### POST /call/join

Allows a patient (or doctor rejoining) to receive a token for an existing room.

**Request body:**
```json
{
  "callId": "string",
  "participantId": "string"
}
```

**Response:**
```json
{
  "roomName": "string",
  "token": "string (LiveKit JWT)"
}
```

---

### GET /call/{id}/results

Returns the current state of a call and, if processing is complete, the transcript and AI output.

**Response:**
```json
{
  "callId": "string",
  "status": "pending | active | processing | completed | processing_failed",
  "recordingUrl": "string (signed URL, expires in 15 min, only if completed)",
  "transcript": "string (full text)",
  "aiSummary": {
    "summary": "string",
    "symptoms": ["string"],
    "assessments": ["string"],
    "medications": ["string"],
    "followUpActions": ["string"]
  },
  "createdAt": "ISO8601",
  "completedAt": "ISO8601 | null"
}
```

---

### POST /webhooks/livekit

Internal endpoint. Receives signed webhooks from LiveKit. Validates the `Authorization` header using the LiveKit webhook secret. Processes `room.finished` and `egress.ended` events.

---

## 8. Data Model

```
Call {
  id                UUID, primary key
  doctorId          string, indexed
  patientId         string, indexed
  roomName          string, unique
  status            enum: pending | active | processing | completed | processing_failed
  recordingPath     string (S3 object key)
  transcript        text, nullable
  aiSummary         jsonb, nullable
  aiSchemaVersion   integer, default 1
  egressId          string (LiveKit egress job ID), nullable
  processingJobId   string (BullMQ job ID), nullable
  createdAt         timestamp
  startedAt         timestamp, nullable
  endedAt           timestamp, nullable
  completedAt       timestamp, nullable
}
```

The `aiSchemaVersion` field is important. When the prompt or output structure changes, increment this value. Queries for call results should be schema-version-aware so old records are rendered correctly even if the schema has changed.

---

## 9. Component Breakdown

### 9.1 call-core (shared SDK package)

- Wraps LiveKit Web SDK and React Native SDK behind a unified interface.
- Exposes React hooks: `useRoom`, `useParticipants`, `useLocalTracks`, `useConnectionQuality`.
- Handles token exchange (calls backend API on mount).
- Emits typed events for room lifecycle.
- Has no dependency on the UI layer.

### 9.2 Call UI (web and mobile)

- Video grid: renders up to 2 participant video tiles.
- Controls: mute audio, disable camera, end call.
- Status bar: connection quality indicator, call duration.
- Waiting state: shown when only one participant has joined.
- Error state: shown when connection fails, with a rejoin option.

### 9.3 Backend API

- Authentication middleware (JWT validation, role checking).
- `/call` route group: create, join, results.
- `/webhooks/livekit` route: webhook ingestion and signature validation.
- Queue producer: pushes processing jobs to BullMQ on webhook receipt.
- Signed URL generator: produces time-limited S3 pre-signed URLs on results requests.

### 9.4 Processing Worker

- BullMQ consumer, concurrency configurable (start at 2, scale based on load).
- Isolated steps: download, extract, transcribe, analyse, store.
- Temp file management: clean up on success and on failure.
- Metrics: emit job duration, step latency, and failure counts to a logging service.

---

## 10. Critical Requirements

### 10.1 Recording

Recording must be server-side via LiveKit egress. Client-side recording is not acceptable because it depends on the client remaining connected, having sufficient upload bandwidth, and correctly implementing the recording API. Server-side recording is independent of client behaviour.

Separate audio tracks per participant should be requested from the LiveKit egress where the account tier supports it. This improves transcription accuracy because Whisper can be run on each track independently, reducing speaker confusion. If separate tracks are unavailable, composite audio is the fallback.

### 10.2 Reliability and Idempotency

- Every processing job must be idempotent. Running the same job twice (due to a retry) must produce the same result and must not create duplicate records.
- Jobs must have a maximum of 3 retry attempts with exponential backoff.
- Dead-letter queue must be monitored. Any job in the dead-letter queue must surface as a `processing_failed` status on the call record within 1 minute of entering the queue.
- The backend must not lose webhook events. Incoming LiveKit webhooks should be acknowledged immediately (HTTP 200) and processed asynchronously via the queue, never inline in the HTTP handler.

### 10.3 Security

- All API routes require a valid JWT. Tokens include role claims (`doctor`, `patient`). Patients may not call `POST /call/create` or access another patient's call records.
- Recordings are stored in private S3 buckets. No public access policy. Recording access is exclusively via signed URLs generated by the backend at request time.
- S3 bucket has server-side encryption enabled (AES-256 or KMS).
- LiveKit tokens are scoped: a patient token grants join-only permission to a specific room. It cannot create rooms or access egress controls.
- Webhook endpoint validates the LiveKit `Authorization` header before processing any event.

### 10.4 Performance

- Call join time (from token to first video frame rendered) should be below 2 seconds on a standard broadband connection.
- LiveKit's adaptive bitrate handles degraded network conditions. The minimum acceptable configuration is 640x480 at 15fps at 400kbps.
- Processing pipeline should complete within 3 minutes for a 30-minute call under normal load.

---

## 11. Edge Cases and Failure Handling

Each of the following must have an explicit handling path, not just an error log:

| Scenario | Handling |
|---|---|
| Patient disconnects mid-call and rejoins | LiveKit room stays open. Egress continues uninterrupted. Rejoining issues a new token via `POST /call/join`. |
| Doctor ends the call while patient is still connected | `room.finished` webhook fires. Both clients are disconnected by LiveKit. Processing pipeline starts normally. |
| Egress recording fails to start | Backend retries egress start once after 30 seconds. If it fails again, call status is set to `recording_failed`. Doctor is notified. |
| Recording file is missing when worker tries to download it | Job fails and retries. After 3 failures, moves to dead-letter queue. Status set to `processing_failed`. |
| Whisper returns an empty transcript (silence or poor audio) | AI step is still run with an empty string. Results are stored with a flag indicating low-confidence transcription. Doctor sees a warning in the UI. |
| LLM API timeout or error | Retry up to 3 times. If all fail, store the transcript but leave `aiSummary` null. Status is `completed_partial`. Doctor sees transcript but not the summary. |
| Duplicate webhook delivery from LiveKit | Idempotency key on the job (using `egressId`) prevents duplicate processing jobs from being enqueued. |

---

## 12. Estimated Implementation Complexity

The table below reflects realistic effort, not optimistic estimates.

| Component | Complexity | Notes |
|---|---|---|
| Basic LiveKit call (web, 1:1) | Low | SDK is well-documented. Main risk is token setup. |
| `call-core` package and React hooks | Low–Medium | Needs clean abstraction but no novel engineering. |
| Mobile integration (React Native) | Medium | LiveKit RN SDK has known quirks on Android background audio. Allow extra time. |
| Server-side egress recording | Medium | Egress API is straightforward, but handling egress lifecycle events reliably takes iteration. |
| S3 storage and signed URL generation | Low | Standard AWS SDK usage. |
| Webhook ingestion and queue | Low–Medium | BullMQ setup is fast. The complexity is in idempotency and error routing. |
| Processing worker (FFmpeg + Whisper) | Medium–Hard | FFmpeg parameters need tuning for audio quality. Temp file management needs care. |
| LLM integration and prompt engineering | Medium | Getting consistent structured output from the LLM requires prompt iteration. Schema versioning adds overhead. |
| End-to-end error handling and retries | Hard | This is where most of the production hardening lives. Do not underestimate. |

---

## 13. Estimated Timeline

This assumes a two-person team (1 frontend, 1 backend/infrastructure). The hard parts are back-loaded. Each week should end with a working, testable increment — not just code written.

| Week | Deliverable |
|---|---|
| 1–2 | Web call working end-to-end (no recording). Both participants can join, communicate, and end the call. `call-core` package exists. |
| 3 | Mobile integration. React Native client joins and participates in a call created from web. |
| 3–4 | Server-side recording working. Egress starts automatically, webhook received, recording file appears in S3. |
| 4 | Storage and access layer. Signed URL generation. Backend API complete. |
| 5 | Processing worker. FFmpeg extraction, Whisper transcription, transcript stored on call record. |
| 6 | LLM integration. AI summary generated and stored. Results UI displays transcript and summary. End-to-end pipeline tested on real call recordings. |

---

## 14. Team Requirements

Minimum viable team for this timeline:

- 1 frontend engineer comfortable with React, React Native, and WebRTC concepts.
- 1 backend engineer comfortable with Node.js, queue systems, and cloud infrastructure (S3, IAM, webhooks).

The following additions would meaningfully reduce risk:

- 1 DevOps/infrastructure engineer to own the LiveKit deployment, Redis, and S3 configuration independently from feature work.
- 1 AI/ML engineer to own prompt engineering, Whisper configuration, and audio pre-processing if quality is a recurring problem.

---

## 15. Risks

### Risk 1: Network conditions in the target user base

Doctors and patients may be on consumer broadband or mobile data. LiveKit's adaptive bitrate mitigates most issues, but the floor has to be defined: below 400kbps or above 200ms RTT, call quality degrades noticeably. Minimum system requirements should be documented and communicated to users.

Mitigation: Test on throttled connections early. Set clear minimum network requirements in the product.

### Risk 2: Transcription accuracy for medical terminology

Whisper performs well on general English but may struggle with drug names, diagnostic terms, or heavily accented speech. Accuracy below 90% on clinical content may make the transcript less useful than expected.

Mitigation: Fine-tune Whisper on a small medical vocabulary dataset if accuracy is insufficient. Use audio pre-processing (FFmpeg noise reduction, normalisation) to improve input quality before sending to Whisper.

### Risk 3: Processing pipeline throughput under load

If many calls end simultaneously (e.g., end of a clinic session), the processing queue may back up. Each processing job takes roughly 1–3 minutes. With a concurrency of 2, 10 simultaneous calls finishing could take 5–15 minutes to process.

Mitigation: The queue system (BullMQ) allows concurrency to be increased horizontally by adding more worker instances. Design the worker to be stateless from the start so it can scale horizontally without code changes.

### Risk 4: LiveKit egress reliability

LiveKit's egress is a managed component. Egress failures are rare but documented. If egress fails silently (no webhook, no file), the pipeline never starts.

Mitigation: Implement a scheduled check: any call that has been in `active` status for more than 30 minutes with no `egress.ended` webhook should be flagged for manual review. Do not rely exclusively on webhooks.

---

## 16. Success Metrics

The following metrics define whether the initial release is functioning as intended. They should be measured from the first week of live usage.

| Metric | Target |
|---|---|
| Call connection success rate | > 95% of initiated calls where both parties attempt to join |
| Recording capture rate | > 99% of completed calls produce a recording file in S3 |
| Transcription completion rate | > 97% of recordings produce a non-empty transcript |
| Transcription word accuracy (spot-checked) | > 90% on clearly spoken English |
| End-to-end processing time | < 3 minutes for calls up to 30 minutes in length |
| Processing failure rate | < 1% of calls end in `processing_failed` status |

---

## 17. Future Enhancements (Not in Scope)

These are noted here so they do not get designed out of the architecture accidentally.

- Real-time transcription displayed to the doctor during the call.
- Automatic population of doctor note templates from the AI output.
- Searchable call history across all of a patient's consultations.
- Multi-language transcription (Whisper supports this natively; it would require changes to the prompt and schema).
- Group calls for multi-party consultations.
- Integration with EHR systems for direct record writing.