# Task 1: Shared SDK (`call-core`) and Infrastructure Setup

## Objective
Set up the shared SDK package (`call-core`) that wraps the LiveKit SDK, and provision the necessary infrastructure (LiveKit, S3, Redis).

## Prerequisites
- Node.js installed
- LiveKit Cloud account or self-hosted instance
- AWS S3 or GCP bucket configured

## Tasks
- [ ] Initialize `packages/call-core` with TypeScript.
- [ ] Install LiveKit Web SDK (`livekit-client`) and React Native SDK dependencies.
- [ ] Implement `LiveKitProvider` context to wrap the application state.
- [ ] Implement `joinRoom(token, roomName)` function/hook.
- [ ] Implement `leaveRoom()` function/hook.
- [ ] Expose `useParticipants()` to get reactive list of current participants.
- [ ] Expose `useConnectionState()` to get connection quality metrics.
- [ ] Expose room-level typed events (e.g., `participantJoined`, `trackPublished`).
- [ ] Test the SDK components independently.
- [ ] Set up infrastructure: S3 bucket (with IAM roles for server-side egress).
- [ ] Set up LiveKit Server/Cloud with egress integration pointing to S3.
- [ ] Document environment variables required (e.g., LiveKit API Key, Secret).
