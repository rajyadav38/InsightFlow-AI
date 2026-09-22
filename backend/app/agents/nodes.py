from app.agents.state import GenerationState
from app.services.context_builder import build_context
from app.services.llm_service import generate_text
from app.services.retrieval_service import (
    retrieve_relevant_chunks,
)


def supervisor_node(
    state: GenerationState,
) -> GenerationState:
    """
    Supervisor prepares and validates
    the generation workflow.
    """

    topic = state.get("topic", "").strip()

    if not topic:
        raise ValueError(
            "Topic cannot be empty"
        )

    return state


def retriever_node(
    state: GenerationState,
) -> GenerationState:
    """
    Retrieve relevant information from
    the project's ChromaDB sources.
    """

    chunks = retrieve_relevant_chunks(
        query=state["topic"],
        project_id=state["project_id"],
        n_results=5,
    )

    if not chunks:
        return {
            **state,
            "retrieved_chunks": [],
            "context": "",
        }

    context = build_context(chunks)

    return {
        **state,
        "retrieved_chunks": chunks,
        "context": context,
    }


def writer_node(
    state: GenerationState,
) -> GenerationState:
    """
    Generate content using only the
    retrieved source context.
    """

    chunks = state.get(
        "retrieved_chunks",
        [],
    )

    if not chunks:
        return {
            **state,
            "generated_content": "",
        }

    instructions = (
        state.get("instructions")
        or "No additional instructions."
    )

    prompt = f"""
You are InsightFlow AI, an AI content generation
assistant.

Generate {state["content_type"]} content using ONLY
the information provided in the source context.

Do not use outside knowledge.

Keep the generated content factually grounded
in the provided sources.

---------------- TOPIC ----------------

{state["topic"]}

---------------- TONE ----------------

{state["tone"]}

---------------- INSTRUCTIONS ----------------

{instructions}

---------------- SOURCE CONTEXT ----------------

{state["context"]}

---------------- END SOURCE CONTEXT ----------------

Return ONLY the generated content.
"""

    content = generate_text(prompt)

    return {
        **state,
        "generated_content": content,
    }


def fact_checker_node(
    state: GenerationState,
) -> GenerationState:
    """
    Check whether the generated content
    is supported by the retrieved context.
    """

    generated_content = state.get(
        "generated_content",
        "",
    )

    if not generated_content:
        return {
            **state,
            "fact_check_result": "NO_CONTENT",
        }

    prompt = f"""
You are the Fact Checker for InsightFlow AI.

Check whether the generated content is supported
by the provided source context.

Do not use outside knowledge.

Return exactly one of:

PASS
FAIL

---------------- SOURCE CONTEXT ----------------

{state["context"]}

---------------- GENERATED CONTENT ----------------

{generated_content}

---------------- RESULT ----------------
"""

    result = generate_text(prompt).strip()

    if result not in {"PASS", "FAIL"}:
        result = "FAIL"

    return {
        **state,
        "fact_check_result": result,
    }