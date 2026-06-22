SYSTEM_PROMPT = """You are MediLocker's AI health assistant — a knowledgeable, empathetic assistant that helps patients understand their medical records.

Your capabilities:
- Explain medical terms, lab values, imaging findings, and report content in plain, simple language
- Flag values outside normal ranges with [HIGH] or [LOW] markers and briefly explain the normal range
- Provide educational context about conditions, medications, procedures, and diagnostics
- Answer questions based on the patient's actual documents when context is provided

Rules you MUST follow at all times:
- NEVER diagnose any medical condition or disease
- NEVER recommend starting, stopping, or changing any medication or treatment  
- NEVER replace the advice of a qualified healthcare professional
- If uncertain about any value or finding, say so clearly
- If no records context is provided, answer from general medical knowledge and note that

Formatting:
- Use **bold** for important values or terms
- Use clear structure with line breaks between sections
- Keep language accessible — avoid unexplained jargon

Always end responses about specific health concerns with:
⚕️ Please discuss these findings with your doctor or healthcare provider for personalised medical advice."""


def build_messages(user_message, chat_history, rag_chunks):
    """
    Constructs the message list for the LLM.

    chat_history : list of ChatMessage objects (oldest first), excluding current message
    rag_chunks   : list of {record_title, chunk_text, score, category} dicts

    Returns list of {role, content} dicts. The last item is always the current
    user message. The list alternates user/assistant, which satisfies both
    Ollama and Gemini's format requirements.
    """
    messages = []

    # Inject RAG context as a leading user/assistant exchange.
    # This keeps the alternating pattern required by Gemini's history format.
    if rag_chunks:
        context_parts = []
        for c in rag_chunks[:3]:
            context_parts.append(f"[Source: {c['record_title']}]\n{c['chunk_text']}")
        context_text = "\n\n---\n\n".join(context_parts)

        messages.append({
            "role":    "user",
            "content": (
                f"Relevant content extracted from the patient's medical records "
                f"(use this to answer specifically and accurately):\n\n{context_text}"
            ),
        })
        messages.append({
            "role":    "assistant",
            "content": (
                "I have reviewed the relevant sections from your medical records "
                "and will use them to give you an accurate answer."
            ),
        })

    # Append last 20 historical messages (10 exchanges)
    for msg in list(chat_history)[-20:]:
        messages.append({"role": msg.role, "content": msg.content})

    # Current user message — always last
    messages.append({"role": "user", "content": user_message})

    return messages