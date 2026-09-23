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
    Generate or revise content using only
    the retrieved source context.
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

    previous_content = state.get(
        "generated_content",
        "",
    )

    fact_check_feedback = state.get(
        "fact_check_feedback",
        "",
    )

    revision_count = state.get(
        "revision_count",
        0,
    )

    revision_instructions = ""

    if previous_content and fact_check_feedback:
        revision_instructions = f"""
This is revision number {revision_count}.

The previous version was checked by the
Fact Checker and needs improvement.

FACT CHECKER FEEDBACK:

{fact_check_feedback}

PREVIOUS CONTENT:

{previous_content}

Revise the previous content to fix the
identified problems.

Do not introduce information that is not
supported by the source context.
"""

    prompt = f"""
You are the Writer Agent for InsightFlow AI.

Generate {state["content_type"]} content using ONLY
the information provided in the source context.

Do not use outside knowledge.

Keep every factual claim grounded in the
provided sources.

---------------- TOPIC ----------------

{state["topic"]}

---------------- TONE ----------------

{state["tone"]}

---------------- INSTRUCTIONS ----------------

{instructions}

---------------- SOURCE CONTEXT ----------------

{state["context"]}

---------------- REVISION ----------------

{revision_instructions}

---------------- END CONTEXT ----------------

Return ONLY the final content.
"""

    content = generate_text(prompt)

    return {
        **state,
        "generated_content": content,
        "revision_count": revision_count + (
            1 if previous_content else 0
        ),
    }


def fact_checker_node(
    state: GenerationState,
) -> GenerationState:
    """
    Check whether generated content is supported
    by the retrieved source context.
    """

    generated_content = state.get(
        "generated_content",
        "",
    )

    if not generated_content:
        return {
            **state,
            "fact_check_result": "NO_CONTENT",
            "fact_check_feedback": "",
        }

    prompt = f"""
You are the Fact Checker Agent for InsightFlow AI.

Check the generated content against ONLY the
provided source context.

Do not use outside knowledge.

Determine whether the factual claims in the
generated content are supported by the sources.

Return your response in exactly this format:

RESULT: PASS

FEEDBACK: The content is fully supported by
the provided sources.

OR:

RESULT: FAIL

FEEDBACK: Explain specifically which claims
are unsupported, inaccurate, or need revision.

---------------- SOURCE CONTEXT ----------------

{state["context"]}

---------------- GENERATED CONTENT ----------------

{generated_content}

---------------- END ----------------
"""

    result = generate_text(prompt).strip()

    if "RESULT: PASS" in result:
        fact_check_result = "PASS"
    else:
        fact_check_result = "FAIL"

    feedback = result

    return {
        **state,
        "fact_check_result": fact_check_result,
        "fact_check_feedback": feedback,
    }
    
def route_after_fact_check(
    state: GenerationState,
) -> str:
    """
    Decide whether the workflow should finish
    or send the content back to the Writer.
    """

    result = state.get(
        "fact_check_result",
        "",
    )

    revision_count = state.get(
        "revision_count",
        0,
    )

    max_revisions = state.get(
        "max_revisions",
        2,
    )

    if result == "PASS":
        return "end"

    if result == "NO_CONTENT":
        return "end"

    if revision_count >= max_revisions:
        return "end"

    return "revise"