# 🚀 Assertiveness Training

Many people struggle to speak up. In therapy, at work, in relationships, to themselves, or in any other situation. Assertiveness Practice is a free, open tool to help build that skill through low-pressure repetition. It gives you a random topic, a timer, and a space to just practice talking. You can do it alone or with a partner.

A topic and image is shown to you on the [home page](https://assertiveness-training.vercel.app/). Talk about the topic for the selected amount of time. When the timer runs out, the app will automatically display a new one. You can do this by yourself or with a partner! The timer is also customizable!

# Try it Out Today!

Website: [assertiveness-training.vercel.app](assertiveness-training.vercel.app)

<details>
<summary>Development Docs</summary>
  
  ## API Routes

  The app uses Next.js API routes for topics, user/session management, and signed recording uploads. OAuth/session routes are intentionally excluded here; they are handled by NextAuth under `/api/auth/*`.

  ### Topics
  - `GET /api/topics` — returns all topics in the database.
  - `POST /api/topics` — creates a new topic from a submitted name and fetches a matching Unsplash image.
  - `GET /api/topics/random` — returns a single random topic record.
  - `GET /api/topics/[topicId]` — fetches a specific topic by Mongo ObjectId.
  - `POST /api/process/topics` — backfills topic data from the local topic list into MongoDB and attaches an Unsplash image when available.

  ### Sessions
  - `GET /api/sessions` — fetches a user's session history and signed recording URLs.
  - `POST /api/sessions` — creates a session record; supports both JSON payloads and multipart form uploads for recorded audio.
  - `PATCH /api/sessions/[sessionId]` — updates a session's allowed fields.
  - `DELETE /api/sessions` — deletes a recording and removes its underlying R2 object, session, and related records when applicable.
  - `GET /api/sessions/[sessionId]` — fetches a specific session, optionally populating recordings.
  - `DELETE /api/sessions/[sessionId]` — deletes a specific session and its associated recordings (admin-only).

  ### Recordings
  - `GET /api/recordings` — returns recordings for a session or a limited admin list.
  - `POST /api/recordings` — creates a recording metadata document after a session is saved.
  - `GET /api/recordings/[recordingId]` — fetches a specific recording.
  - `DELETE /api/recordings/[recordingId]` — deletes a recording by id.

  ### Storage / External Services
  - Cloudflare R2 is used for uploaded audio storage via the helpers in `util/r2.ts`.
  - The app signs URLs with `getSignedAudioUrl`, uploads audio with `uploadAudioToR2`, and deletes stored files with `deleteAudioFromR2`.
  - Unsplash is used for topic imagery when creating or backfilling topic entries.
  
  ## Topics API
  topics are processed from a file, to the database, setting the image by utilizing the unsplash apis. On the home page, it calls the db for a random topic displaying it to the user along with the image.
  
  ## Roadmap
   - ✔️ Implement configurable timer for how long to speak about the topic(Implemented with [this commit](https://github.com/razznblue/assertiveness/commit/929b0a5a80bec5f9c2922747da38a5f1fd265472))
   - Rate your session
   - Building out the rest of the tabs on the profile page
   - Avatar Images
</details>

## Screenshots:

<img width="1920" height="1080" alt="1" src="https://github.com/user-attachments/assets/aa7cb3f2-8023-40b2-9ad8-e243c6db8480" />
<img width="1920" height="1080" alt="2" src="https://github.com/user-attachments/assets/bca41d62-0d2a-41e1-9166-6bcea2d877eb" />
<img width="1920" height="1080" alt="3" src="https://github.com/user-attachments/assets/a6604e4c-9319-4bf7-829d-e8fc990c9a24" />
<img width="1920" height="1080" alt="4" src="https://github.com/user-attachments/assets/c3587f65-bc3f-4dbc-be81-dd6f0f3e6c5f" />
<img width="1920" height="1080" alt="5" src="https://github.com/user-attachments/assets/4759e7b4-b597-48a8-a25b-576f16627d0e" />
