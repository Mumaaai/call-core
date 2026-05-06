# Task 2: Backend API & Database Setup

## Objective
Build the Node.js API server responsible for authentication, Room management, webhooks, and queuing processing jobs.

## Prerequisites
- Task 1 Infrastructure setup
- Database (PostgreSQL recommended based on data model)
- Redis for BullMQ

## Tasks
- [ ] Initialize `apps/api` with Node.js and Hono (or Express).
- [ ] Set up database connection and migrations for the `Call` table schema.
- [ ] Implement `POST /call/create` route:
  - Generate a new UUID for `callId`
  - Create room via LiveKit Server SDK
  - Store `Call` record with `pending` status
  - Generate and return doctor token and `roomId`
- [ ] Implement `POST /call/join` route:
  - Validate `callId` and `participantId`
  - Generate and return patient/participant token
- [ ] Implement `GET /call/{id}/results` route:
  - Fetch call state from database
  - Generate 15-minute signed S3 URL if `status === 'completed'`
  - Return transcript and `aiSummary` JSON
- [ ] Set up BullMQ Producer:
  - Configure Redis connection
  - Define `processingQueue` to enqueue tasks after calls end
- [ ] Implement LiveKit Webhook Handler (`POST /webhooks/livekit`):
  - Validate `Authorization` signature
  - Handle `room.finished` event
  - Handle `egress.ended` event (marks call as `processing` and enqueues job with recording URL)
- [ ] Write integration tests for API endpoints.
