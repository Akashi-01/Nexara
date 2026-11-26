<div align="center">

# Nexara

### Natural, intelligent conversations.

An open-source, full-stack, ChatGPT-style conversational AI assistant with real-time token streaming, persistent multi-thread chat history, and a clean light/dark interface.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nexara-sable.vercel.app/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Groq](https://img.shields.io/badge/Inference-Groq-F55036)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Streaming Protocol](#streaming-protocol)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Nexara pairs a React chat interface with a Node.js/Express backend. Conversations are stored as threads in MongoDB, and AI replies are generated through the [Groq API](https://groq.com) using its OpenAI-compatible chat-completions endpoint. Replies stream token-by-token to the browser over Server-Sent Events (SSE), so responses appear as they are generated rather than after a long wait.

## Live Demo

**[Try Nexara live](YOUR_VERCEL_FRONTEND_URL)**

> **Note:** The backend runs on a free hosting tier that may spin down when idle, so the first message after a period of inactivity can take up to a minute to respond.

<!-- Add a screenshot or GIF here:
![Nexara Screenshot](docs/screenshot.png)
-->

## Features

**Conversation**
- **Multiple threads** – create, switch between, and delete conversations from the sidebar. Each thread is identified by a client-generated UUID.
- **Persistent history** – threads and messages are stored in MongoDB and reload whenever a thread is selected.
- **Conversation memory** – the model receives the last 20 messages of the thread as context, so follow-up questions work naturally.

**Real-time streaming**
- **True token streaming** over SSE from Groq, with the spinner clearing as soon as the first token arrives.
- **Stop generation** – cancel a reply mid-stream. Partial replies are kept and persisted, and the upstream Groq request is aborted when the client disconnects.
- **In-chat error state** – failed requests surface visibly in the conversation instead of failing silently.

**Message tools**
- **Edit and resend** user messages. The thread history is truncated server-side so no stale turns are left in the database.
- **Copy to clipboard** on individual code blocks and on full assistant messages.

**Rendering and UI**
- **Markdown rendering** with syntax-highlighted code blocks (`react-markdown` + `rehype-highlight`, GitHub Dark theme).
- **Light/dark theme** toggle, applied via a `data-theme` attribute and persisted in `localStorage`.
- **ChatGPT-style layout** with a thread sidebar and a focused chat window.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8 |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| AI Inference | Groq API (OpenAI-compatible chat completions, model: `qwen/qwen3.8-27b`) |
| Markdown / Code | react-markdown, rehype-highlight |
| Utilities | CORS, dotenv, nodemon, uuid, react-spinners |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

## Architecture

```
┌────────────┐   POST /api/chat    ┌─────────────┐   stream: true   ┌──────────┐
│   React    │ ──────────────────► │   Express   │ ───────────────► │   Groq   │
│  (Vercel)  │ ◄────────────────── │  (Render)   │ ◄─────────────── │   API    │
└────────────┘   SSE token stream  └──────┬──────┘   token chunks   └──────────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │   MongoDB   │
                                   │   (Atlas)   │
                                   └─────────────┘
```

1. The user message is saved to MongoDB **before** the AI call.
2. The server streams tokens from Groq and forwards them to the browser as SSE events.
3. The assistant message is saved when the stream ends, including partial replies after a Stop.
4. If the client disconnects, the upstream Groq request is cancelled.

## Project Structure

```
Nexara/
├── Backend/
│   ├── models/
│   │   └── Thread.js          # Mongoose schema (threads + messages)
│   ├── routes/
│   │   └── chat.js            # Thread CRUD + streaming /chat route
│   ├── utils/
│   │   └── openai.js          # Groq API integration (streaming generator)
│   └── server.js              # Express app entry point
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CodeBlock.jsx  # Highlighted code block with copy button
    │   │   └── CopyButton.jsx # Reusable copy-to-clipboard button
    │   ├── App.jsx            # Root component & shared state
    │   ├── Sidebar.jsx        # Thread list & thread management
    │   ├── ChatWindow.jsx     # Chat display, input, streaming, stop button
    │   ├── Chat.jsx           # Individual message rendering
    │   ├── MyContext.jsx      # React context for global state
    │   └── streamChat.js      # SSE stream reader for POST responses
    └── index.html
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A [MongoDB](https://www.mongodb.com/) database (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Groq API key](https://console.groq.com/keys)

### 1. Clone the repository

```bash
git clone https://github.com/Akashi-01/Nexara.git
cd Nexara
```

### 2. Set up the backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/` (see [Environment Variables](#environment-variables)), then start the server:

```bash
npm run dev
```

The API runs on `http://localhost:8080` by default.

### 3. Set up the frontend

```bash
cd ../Frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Description |
| --- | --- |
| `MONGODB_URL` | MongoDB connection string |
| `GROQ_API_KEY` | Your Groq API key |
| `PORT` | Server port (optional, defaults to `8080`) |

### Frontend (`Frontend/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:8080`) |

> Never commit `.env` files. They are listed in `.gitignore`.

## API Reference

Base path: `/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/thread` | List all threads |
| `GET` | `/api/thread/:threadId` | Get all messages in a thread |
| `DELETE` | `/api/thread/:threadId` | Delete a thread |
| `POST` | `/api/chat` | Send a message and stream the AI reply (SSE) |

### `POST /api/chat`

**Request body**

```json
{
  "threadId": "uuid-generated-by-client",
  "message": "Explain closures in JavaScript",
  "truncateTo": 4
}
```

| Field | Required | Description |
| --- | --- | --- |
| `threadId` | Yes | Thread identifier. A new thread is created if it does not exist. |
| `message` | Yes | The user's message |
| `truncateTo` | No | Trim thread history to this many messages before appending, used when editing an earlier message |

**Response:** `text/event-stream`. Errors before streaming starts return standard JSON status codes.

## Streaming Protocol

The server emits Server-Sent Events in the following format:

```
data: {"token": "Hello"}

data: {"token": " world"}

data: {"done": true}
```

If a failure occurs after headers have been sent, an error event is emitted instead:

```
data: {"error": "Description of what went wrong"}
```

The frontend reads the stream with `fetch` and `response.body.getReader()` rather than `EventSource`, because `EventSource` only supports `GET` requests.

## Deployment

| Component | Platform | Notes |
| --- | --- | --- |
| Frontend | [Vercel](https://vercel.com) | Set `VITE_API_URL` to your deployed backend URL |
| Backend | [Render](https://render.com) | Set `MONGODB_URL` and `GROQ_API_KEY` as environment variables; start command `npm start` |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) | Allow Render's outbound IPs (or `0.0.0.0/0`) in Network Access |

Make sure the backend's CORS configuration allows only your frontend domain.

## Roadmap

- [ ] Retry button on failed replies
- [ ] User accounts (JWT) with per-user thread isolation and shareable thread links
- [ ] Model selection and custom system prompts per thread
- [ ] Search, inline rename, and pin/favorite threads
- [ ] File and image upload, plus basic RAG over uploaded documents
- [ ] Rate limiting and retry-with-backoff around Groq calls
- [ ] Auto-scroll with a "jump to latest" button
- [ ] Collapsible sidebar for mobile
- [ ] Admin dashboard (threads, messages per day, API error rate)

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

See [`LICENSE`](LICENSE) for details.
This project is intended for educational and portfolio purposes.

---

<div align="center">

Built by [Akashi-01](https://github.com/Akashi-01)

</div>
