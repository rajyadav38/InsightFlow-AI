# 🚀 InsightFlow AI

### Agentic Knowledge Intelligence Platform powered by Retrieval-Augmented Generation (RAG)

**InsightFlow AI** is an AI-powered knowledge platform that transforms documents and online sources into searchable knowledge. It combines Retrieval-Augmented Generation (RAG), semantic search, AI research, and context-aware content generation in one application.

Instead of simply generating answers from an LLM's general knowledge, InsightFlow AI retrieves relevant information from your sources to help produce more context-aware answers and content.

🌐 **Live Application:** [https://insight-flow-ai-navy.vercel.app](https://insight-flow-ai-navy.vercel.app)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Technology Stack](#️-technology-stack)
- [Architecture](#️-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Author](#-author)

## 💡 Overview

Information is often scattered across documents, articles, and social media. Finding relevant information and turning it into useful output can be time-consuming.

InsightFlow AI addresses this challenge by allowing users to build a knowledge base from their sources and use AI to search, understand, research, and generate content from that knowledge.

The primary focus of this project is implementing a practical **RAG pipeline**, from document ingestion and text chunking to embedding generation, vector storage, retrieval, and LLM-powered responses.

## ✨ Key Features

### 📄 1. Document and URL Ingestion

- Upload PDF, DOCX, and TXT documents.
- Add online sources through URLs.
- Ingest supported Twitter/X tweet URLs.
- Process source content into smaller chunks for retrieval.
- Organize knowledge sources within projects.

### 💬 2. RAG-Based AI Chat

- Ask questions about your uploaded knowledge sources.
- Retrieve relevant context using semantic search.
- Generate context-aware answers using an LLM.
- Access citations associated with retrieved source material.

### 🧠 3. Semantic Search

- Generate vector embeddings for text chunks.
- Store and retrieve embeddings using Chroma Cloud.
- Find relevant content based on meaning rather than relying only on exact keyword matches.

### 🔍 4. AI Research

- Explore information using your available knowledge sources.
- Use AI-powered research workflows to investigate topics.
- Build on retrieved context to support research and information discovery.

### ✍️ 5. AI Content Generation

Generate useful content with AI using available source context.

A practical use case is **Twitter/X reply generation**: provide a supported tweet URL and generate a context-aware reply based on the tweet's content.

This demonstrates how RAG and generative AI can support practical writing and social media workflows.

### 📚 6. Project-Based Knowledge Management

- Keep sources organized by project.
- Access your project's knowledge through chat, research, and generation.
- Maintain source and project information in the application.

## ⚙️ How It Works

InsightFlow AI follows a RAG workflow:

```text
       Documents / URLs / Tweets
                  |
                  v
          Source Ingestion
                  |
                  v
       Text Extraction / Parsing
                  |
                  v
             Text Chunking
                  |
                  v
         Gemini Embeddings
                  |
                  v
             Chroma Cloud
           (Vector Storage)
                  |
        User Query / Prompt
                  |
                  v
          Query Embedding
                  |
                  v
       Relevant Context Retrieval
                  |
                  v
          Gemini / LLM Response
                  |
                  v
       Chat / Research / Generation
```

**In simple terms:**

1. **Ingest:** Users upload documents or add supported URLs.
2. **Process:** The backend extracts text and splits it into chunks.
3. **Embed:** Gemini generates vector embeddings for the chunks.
4. **Store:** Chroma Cloud stores the embeddings and associated metadata.
5. **Retrieve:** A user query is embedded and matched against relevant stored content.
6. **Generate:** The retrieved context is used to produce an answer or support an AI workflow.

## 🛠️ Technology Stack

| Component           | Technology                |
| ------------------- | ------------------------- |
| Frontend            | React, Vite, Tailwind CSS |
| Backend             | Python, FastAPI           |
| Database            | MongoDB Atlas             |
| Vector Database     | Chroma Cloud              |
| Embeddings and LLM  | Google Gemini             |
| AI Orchestration    | LangChain, LangGraph      |
| Frontend Deployment | Vercel                    |
| Backend Deployment  | Render                    |

## 🏗️ Architecture

InsightFlow AI separates the frontend, backend, application data, and vector retrieval infrastructure.

- **Frontend:** Provides the user interface for projects, sources, AI Chat, Research, and content generation.
- **FastAPI backend:** Handles API requests, source processing, retrieval, and AI workflows.
- **MongoDB Atlas:** Stores application data such as users, projects, and source metadata.
- **Chroma Cloud:** Stores vector embeddings and metadata used for semantic retrieval.
- **Gemini:** Provides embedding generation and language-model capabilities.
- **LangChain and LangGraph:** Support the application's AI and workflow orchestration.

## 🚀 Getting Started

You can use the deployed application directly:

**[Open InsightFlow AI →](https://insight-flow-ai-navy.vercel.app)**

To run the project locally, follow these steps.

### Prerequisites

Install or configure:

- Node.js and npm
- Python and pip
- MongoDB Atlas
- Chroma Cloud
- A Google Gemini API key

You will also need the repository's required frontend and backend dependencies.

### 1. Clone the repository

```bash
git clone https://github.com/rajyadav38/InsightFlow-AI.git
cd InsightFlow-AI
```

### 2. Configure the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory and configure the required environment variables.

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Configure the frontend environment variables according to the frontend API configuration in the project.

### 4. Run the application

Start the backend from the `backend` directory:

```bash
python -m uvicorn app.main:app --reload
```

Start the frontend from the `frontend` directory:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

> **Note:** Local setup requires valid database credentials and API keys. Consult the project's configuration files and dependency lists for any additional required settings.

## 🔐 Environment Variables

Configure the following values using your local `.env` file and your deployment provider's environment settings.

| Variable          | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `MONGODB_URI`     | MongoDB Atlas connection string          |
| `MONGODB_DB_NAME` | Application database name                |
| `CHROMA_API_KEY`  | Chroma Cloud API key                     |
| `CHROMA_TENANT`   | Chroma Cloud tenant                      |
| `CHROMA_DATABASE` | Chroma Cloud database                    |
| `GEMINI_API_KEY`  | Google Gemini API key                    |
| `FRONTEND_URL`    | Allowed frontend origin for backend CORS |

Additional variables may be required by individual services or frontend configuration.

**Security:** Never commit `.env` files, database credentials, or API keys to GitHub. Keep `.env` in `.gitignore` and use environment variables in production.

## ☁️ Deployment

The application is deployed using:

- **Frontend:** [Vercel](https://vercel.com/)
- **Backend:** [Render](https://render.com/)
- **Application database:** [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Vector database:** [Chroma Cloud](https://www.trychroma.com/)

The frontend communicates with the deployed FastAPI backend, while MongoDB Atlas and Chroma Cloud provide persistent application data and vector retrieval infrastructure.

## 🔮 Future Improvements

Potential areas for further development include:

- UI and user experience enhancements.
- More advanced research workflows.
- Additional source integrations.
- Improved document-processing feedback and error handling.
- Expanded retrieval evaluation and response-quality testing.
- More comprehensive testing and performance optimization.

## 🤝 Contributing

Suggestions, bug reports, and feature ideas are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Open a pull request describing your improvements.

## 👨‍💻 Author

**Raj Yadav**

B.Tech CSE (AI/ML) student interested in AI engineering, Retrieval-Augmented Generation, and full-stack development.

- GitHub: [@rajyadav38](https://github.com/rajyadav38)
- Project: [InsightFlow AI](https://github.com/rajyadav38/InsightFlow-AI)
- Live Demo: [Try InsightFlow AI](https://insight-flow-ai-navy.vercel.app)

---

⭐ If you find this project interesting, consider starring the repository!

_Built to explore how RAG and generative AI can transform information into actionable knowledge._
