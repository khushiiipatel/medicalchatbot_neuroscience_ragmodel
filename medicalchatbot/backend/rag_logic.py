


import os
import json
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage


OLLAMA_MODEL = "qwen2.5"     
PDF_FOLDER   = "./pdfs"        # folder with your PDFs
FAISS_DIR    = "./faiss_store" # vector store saved here

# ── System prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are a Neuroscience tutor for medical students.

Strict rules:
1. Answer ONLY using the context provided. Never use outside knowledge.
2. If the answer is not in the context, say:
   "I could not find this topic in the provided documents."
3. Keep the language clear and educational.
4. You MUST finish every answer with this block — never skip it:

---
Reference:
  Document : <pdf filename>
  Page     : <page number>
---"""

# ── Module-level cache ────────────────────────────────────────
_vectorstore = None


def _build_vectorstore():
    """
    Loads all PDFs, splits into chunks, builds FAISS vector store.
    Saves to disk so it only runs once.
    """
    global _vectorstore

    pdf_dir = Path(PDF_FOLDER)

    if not pdf_dir.exists():
        raise FileNotFoundError(f"Folder '{PDF_FOLDER}' not found. Add your PDFs there.")

    pdf_files = sorted(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        raise ValueError("No PDFs found in ./pdfs folder.")

    all_docs = []

    # ── Load each PDF ─────────────────────────────────────
    for pdf_path in pdf_files:
        print(f"[RAG] Loading → {pdf_path.name}")
        loader = PyPDFLoader(str(pdf_path))
        pages  = loader.load()

        for page in pages:
            page.metadata["source"] = pdf_path.name

        all_docs.extend(pages)
        print(f"         {len(pages)} pages loaded")

    print(f"[RAG] Total pages : {len(all_docs)}")

    # ── Split into chunks ─────────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size    = 500,
        chunk_overlap = 50,
    )
    chunks = splitter.split_documents(all_docs)
    print(f"[RAG] Chunks      : {len(chunks)}")

    # ── Build FAISS vector store ──────────────────────────
    print(f"[RAG] Building embeddings with {OLLAMA_MODEL} ...")
    embeddings = OllamaEmbeddings(model=OLLAMA_MODEL)

    # Build FAISS index from document chunks
    _vectorstore = FAISS.from_documents(
        documents = chunks,
        embedding = embeddings,
    )

    # Save to disk so next startup loads instantly
    Path(FAISS_DIR).mkdir(exist_ok=True)
    _vectorstore.save_local(FAISS_DIR)
    print("[RAG] Vector store ready ✓")
    return _vectorstore


def _get_vectorstore():
    """
    Returns cached vectorstore.
    If already saved on disk, loads it instantly.
    If not, builds it from scratch.
    """
    global _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    faiss_path = Path(FAISS_DIR)

    # Load from disk if already built before
    if faiss_path.exists():
        print("[RAG] Loading saved vector store from disk...")
        embeddings   = OllamaEmbeddings(model=OLLAMA_MODEL)
        _vectorstore = FAISS.load_local(
            FAISS_DIR,
            embeddings,
            allow_dangerous_deserialization=True,
        )
        print("[RAG] Vector store loaded ✓")
        return _vectorstore

    # First time — build from PDFs
    return _build_vectorstore()


def _retrieve_context(question: str) -> tuple:
    """Finds the 4 most relevant chunks for the question."""
    retriever = _get_vectorstore().as_retriever(search_kwargs={"k": 4})
    docs      = retriever.invoke(question)

    parts = []
    for i, doc in enumerate(docs, 1):
        src  = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page",   0) + 1
        parts.append(f"[Source {i} — {src}, Page {page}]\n{doc.page_content}")
    context = "\n\n".join(parts)

    seen, sources = set(), []
    for doc in docs:
        src  = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page",   0) + 1
        if (src, page) not in seen:
            seen.add((src, page))
            sources.append({"doc": src, "page": page})

    return context, sources


# ── Streaming (used by WebSocket) ─────────────────────────────
def stream_answer(question: str):
    """
    Generator — yields answer tokens one by one.
    Last item is a special sources marker.
    """
    context, sources = _retrieve_context(question)

    user_msg = f"""Context from textbooks:
{context}

Question: {question}

Important: End your answer with the mandatory Reference section."""

    llm = ChatOllama(
        model       = OLLAMA_MODEL,
        temperature = 0.1,
        streaming   = True,
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_msg),
    ]

    for chunk in llm.stream(messages):
        token = chunk.content
        if token:
            yield token

    yield f"\n__SOURCES__{json.dumps(sources)}"


# ── Non-streaming (fallback) ──────────────────────────────────
def ask_question(question: str) -> dict:
    """Returns full answer at once — used for testing."""
    context, sources = _retrieve_context(question)

    user_msg = f"""Context from textbooks:
{context}

Question: {question}

Important: End your answer with the mandatory Reference section."""

    llm = ChatOllama(model=OLLAMA_MODEL, temperature=0.1)
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_msg),
    ]

    response = llm.invoke(messages)
    return {"answer": response.content, "sources": sources}