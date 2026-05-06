# Task 4: Frontend Apps (Web & Mobile)

## Objective
Implement the UI layer for the web application (React) and mobile application (React Native) consuming the `call-core` SDK and Backend API.

## Prerequisites
- Task 1 `call-core` SDK implemented
- Task 2 Backend API running

## Tasks
- [ ] Initialize `apps/web` with React + TypeScript (Vite/Next.js).
- [ ] Initialize `apps/mobile` with React Native.
- [ ] Integrate `packages/call-core` as a dependency in both apps.
- [ ] Build Call Setup UI (Web & Mobile):
  - Doctor interface: Button to `POST /call/create` and enter room.
  - Patient interface: Wait for join link, `POST /call/join` and enter room.
- [ ] Build Video Grid UI:
  - Render up to 2 participant video tiles using tracks from `call-core`.
  - Handle 'waiting for participant' empty states.
- [ ] Build Call Controls:
  - Mute/Unmute audio toggle.
  - Enable/Disable camera toggle.
  - End Call button.
- [ ] Build Call Status Bar:
  - Connection quality indicator (from `useConnectionState()`).
  - Call duration timer.
- [ ] Build Results UI:
  - Poll or subscribe to `GET /call/{id}/results`.
  - Display video playback using signed S3 URL.
  - Render the AI Summary structured data (Symptoms, Assessments, etc.).
  - Render the full scrollable transcript with timestamps.
- [ ] Implement error states for connection failures and rejoining logic.
