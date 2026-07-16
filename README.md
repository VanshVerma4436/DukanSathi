# DukanSathi — AI-Powered E-commerce RAG Assistant

> Upload your product manuals, warranty policies, and shipping guides. Ask anything. Get cited answers — directly from your documents.

![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.139+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite)
![LangChain](https://img.shields.io/badge/LangChain-0.3+-1C3C3C?logo=chainlink)
![OpenRouter](https://img.shields.io/badge/LLM-OpenRouter-orange)

---

## 🧠 How It Works

```
User Question
     │
     ▼
Embed query (sentence-transformers/all-MiniLM-L6-v2)
     │
     ▼
FAISS similarity search → Top-K relevant chunks
     │
     ▼
Build context from chunks + source metadata
     │
     ▼
OpenRouter LLM (Nemotron / any model)
     │
     ▼
Answer + Source Citations (document name + page number)
```

---

## ✨ Features

- 📄 **Drag-and-drop PDF upload** with real-time progress
- 🔍 **RAG pipeline** — answers only from uploaded documents, never hallucinates
- 📚 **Source citations** — every answer links back to the exact document and page
- 💬 **Chat interface** with collapsible citation cards
- 🔒 **No data leaves your server** — embeddings are computed locally
- ⚡ **FAISS vector store** persisted to disk — survives restarts
- 🐳 **Docker Compose** support for one-command deployment

---

## 🗂 Project Structure

```
DukanSathi/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + lifespan
│   │   ├── config.py        # Settings from .env
│   │   ├── routes.py        # /upload, /chat, /health endpoints
│   │   ├── rag.py           # FAISS build/load + RAG pipeline
│   │   ├── pdf_loader.py    # PDF → chunks with metadata
│   │   ├── embeddings.py    # Singleton sentence-transformer model
│   │   ├── prompt.py        # System + human prompt templates
│   │   └── models.py        # Pydantic request/response schemas
│   ├── uploads/             # Uploaded PDFs (git-ignored)
│   ├── vectorstore/         # FAISS index (git-ignored)
│   ├── .env.example         # ← Copy this to .env
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/ChatPage.jsx
│   │   ├── components/
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   └── LoadingDots.jsx
│   │   └── services/api.js
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/DukanSathi.git
cd DukanSathi
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux

# Edit .env and set your OPENROUTER_API_KEY
```

### 3. Start the backend

```bash
# Inside backend/ with venv activated
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs available at: `http://127.0.0.1:8000/docs`

### 4. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🐳 Docker Compose (Production)

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API key

# Build and run everything
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | *(required)* | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3-super-120b-a12b:free` | Model slug from OpenRouter |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded PDFs |
| `VECTORSTORE_DIR` | `vectorstore` | Directory for FAISS index |
| `CHUNK_SIZE` | `800` | PDF chunk size (tokens) |
| `CHUNK_OVERLAP` | `150` | Overlap between chunks |
| `TOP_K_RESULTS` | `3` | Number of chunks to retrieve per query |

### Free Models on OpenRouter

Any OpenRouter model works. Recommended free options:

| Model | Slug |
|---|---|
| NVIDIA Nemotron Super 120B | `nvidia/nemotron-3-super-120b-a12b:free` |
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct:free` |

Browse all free models at [openrouter.ai/models](https://openrouter.ai/models?order=top-weekly&supported_parameters=free)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/upload` | Upload PDF files for indexing |
| `POST` | `/api/chat` | Send a question, receive cited answer |

### Chat request/response

```json
// POST /api/chat
{ "question": "What is the return policy?" }

// Response
{
  "answer": "Products can be returned within 30 days...",
  "sources": [
    {
      "document": "return_policy.pdf",
      "page": 2,
      "content": "Customers may return unused products within 30 days..."
    }
  ]
}
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | OpenRouter (any model) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Vector Store** | FAISS (CPU) |
| **Orchestration** | LangChain |
| **Backend** | FastAPI + Uvicorn |
| **PDF Parsing** | PyPDF (via LangChain) |
| **Frontend** | React 18 + Vite 5 |
| **Styling** | Tailwind CSS |
| **HTTP Client** | Axios |
| **Deployment** | Docker Compose + Nginx |

---

## 📝 License

MIT License. See [LICENSE](LICENSE) for details.
