# Nexara

An open-source, ChatGPT-like conversational AI assistant built for natural, intelligent conversations. Nexara pairs a React chat interface with a Node.js/Express backend, persists conversation threads in MongoDB, and generates responses through the Groq API.

## Features

- **Real-time chat interface** — clean, ChatGPT-style UI built with React
- **Conversation threads** — create, switch between, and delete chat threads from the sidebar
- **Persistent chat history** — threads and messages are stored in MongoDB and reloaded on demand
- **Markdown & code rendering** — assistant replies support Markdown formatting with syntax-highlighted code blocks
- **AI-powered responses** — messages are answered via the Groq chat completions API

## Tech Stack

**Frontend**
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/) — build tool and dev server
- [react-markdown](https://github.com/remarkjs/react-markdown) + [rehype-highlight](https://github.com/rehypejs/rehype-highlight) — Markdown and code rendering
- [react-spinners](https://www.davidhu.io/react-spinners/) — loading indicators
- [uuid](https://github.com/uuidjs/uuid) — thread ID generation

**Backend**
- [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- [Groq API](https://groq.com/) — LLM inference
- [dotenv](https://github.com/motdotla/dotenv) + [cors](https://github.com/expressjs/cors)

## Project Structure

```
Nexara/
├── Backend/
│   ├── models/
│   │   └── Thread.js       # Mongoose schema for chat threads & messages
│   ├── routes/
│   │   └── chat.js         # API routes (threads, chat)
│   ├── utils/
│   │   └── openai.js       # Groq API integration
│   ├── server.js           # Express app entry point
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── App.jsx          # Root component & shared state
    │   ├── Sidebar.jsx      # Thread list & thread management
    │   ├── ChatWindow.jsx   # Chat display & message input
    │   ├── Chat.jsx         # Individual message rendering
    │   └── MyContext.jsx    # React context for global state
    ├── index.html
    └── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- A [MongoDB](https://www.mongodb.com/) instance (local or [Atlas](https://www.mongodb.com/atlas))
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

Create a `.env` file in the `Backend/` directory:

```env
MONGODB_URL=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

Start the backend server:

```bash
npm start
```

The server runs on `http://localhost:8080` by default.

### 3. Set up the frontend

In a separate terminal:

```bash
cd Frontend
npm install
npm run dev
```

The app will be available at the local URL printed by Vite (typically `http://localhost:5173`).

## API Reference

All routes are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/thread` | Get all conversation threads, most recently updated first |
| `GET` | `/thread/:threadId` | Get all messages for a specific thread |
| `DELETE` | `/thread/:threadId` | Delete a thread |
| `POST` | `/chat` | Send a message (`{ threadId, message }`) and receive an AI-generated reply |

## Roadmap

- [ ] User authentication
- [ ] Streaming responses
- [ ] Configurable model selection
- [ ] Deployment guide (Docker / cloud hosting)

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a pull request

## License

No license has been specified for this project yet. Consider adding one (e.g. [MIT](https://choosealicense.com/licenses/mit/)) to clarify how others may use your code.

## Author

Built by [Akashi-01](https://github.com/Akashi-01)
