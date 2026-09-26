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
    Supervisor analyzes the user request
    and determines the workflow to execute.
    """

    topic = state.get(
        "topic",
        "",
    ).strip()

    instructions = (
        state.get("instructions")
        or ""
    ).strip()

    content_type = state.get(
        "content_type",
        "",
    ).strip()

    if not topic:
        raise ValueError(
            "Topic cannot be empty"
        )

    prompt = f"""
You are the Supervisor Agent for InsightFlow AI.

Analyze the user's request and determine which
workflow should handle it.

Available workflows:

1. generation
   Use this when the user wants content created
   from the available sources.

2. research
   Use this when the user explicitly wants research,
   investigation, comparison, or a deeper analysis
   across sources.

3. fact_check
   Use this when the user wants to verify whether
   claims or information are supported by the sources.

Return ONLY one of these exact values:

generation
research
fact_check

---------------- CONTENT TYPE ----------------

{content_type}

---------------- TOPIC ----------------

{topic}

---------------- INSTRUCTIONS ----------------

{instructions}

---------------- WORKFLOW ----------------
"""

    workflow = generate_text(
        prompt
    ).strip().lower()

    allowed_workflows = {
        "generation",
        "research",
        "fact_check",
    }

    if workflow not in allowed_workflows:
        workflow = "generation"

    return {
        **state,
        "workflow": workflow,
    }
    
def route_after_supervisor(
    state: GenerationState,
) -> str:
    """
    Route the workflow based on the Supervisor's decision.
    """

    workflow = state.get(
        "workflow",
        "generation",
    )

    if workflow == "research":
        return "research"

    if workflow == "fact_check":
        return "fact_check"

    return "generation"


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

def research_node(
    state: GenerationState,
) -> GenerationState:
    """
    Research Agent analyzes retrieved source chunks
    and creates a structured research brief.
    """

    chunks = state.get(
        "retrieved_chunks",
        [],
    )

    if not chunks:
        return {
            **state,
            "research_brief": "",
            "research_findings": [],
        }

    context = state.get(
        "context",
        "",
    )

    prompt = f"""
You are the Research Agent for InsightFlow AI.

Your task is to analyze the provided source material
and create a structured research brief.

Use ONLY the information contained in the source
context.

Do not use outside knowledge.

Do not invent facts.

Identify the most important findings that directly
help answer the user's request.

For each finding:
- State the finding clearly.
- Explain the supporting evidence.
- Keep the finding grounded in the provided sources.

Then provide a concise overall research brief.

---------------- USER TOPIC ----------------

{state["topic"]}

---------------- USER INSTRUCTIONS ----------------

{state.get("instructions") or "No additional instructions."}

---------------- SOURCE CONTEXT ----------------

{context}

---------------- END SOURCE CONTEXT ----------------

Return the response in this format:

RESEARCH FINDINGS:

1. <finding>
   Evidence: <supporting evidence>

2. <finding>
   Evidence: <supporting evidence>

3. <finding>
   Evidence: <supporting evidence>

RESEARCH BRIEF:

<concise synthesis of the findings>
"""

    research_result = generate_text(
        prompt
    ).strip()

    if not research_result:
        return {
            **state,
            "research_brief": "",
            "research_findings": [],
        }

    # Keep the complete structured research output
    # available to the Writer Agent.
    return {
        **state,
        "research_brief": research_result,
        "research_findings": [
            research_result,
        ],
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
    
    research_brief = state.get(
    "research_brief",
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
    research_section = ""

    if research_brief:
        research_section = f"""
    ---------------- RESEARCH BRIEF ----------------

    {research_brief}

    ---------------- END RESEARCH BRIEF ----------------
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

{research_section}

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

    generated_content = state.get(
        "generated_content",
        "",
    )

    workflow = state.get(
        "workflow",
        "generation",
    )

    # --------------------------------
    # Determine what needs checking
    # --------------------------------

    if workflow == "fact_check":
        content_to_check = state.get(
            "topic",
            "",
        )

        if not content_to_check:
            return {
                **state,
                "fact_check_result": "NO_CONTENT",
                "fact_check_feedback": "",
            }

        check_type = "user's claim"

    else:
        content_to_check = generated_content

        if not content_to_check:
            return {
                **state,
                "fact_check_result": "NO_CONTENT",
                "fact_check_feedback": "",
            }

        check_type = "generated content"

    # --------------------------------
    # Fact-check prompt
    # --------------------------------

    prompt = f"""
You are the Fact Checker Agent for InsightFlow AI.

Your task is to verify the {check_type} using ONLY
the provided source context.

Do not use outside knowledge.

Determine whether the factual claims are supported
by the provided sources.

If the sources support the claim, return PASS.

If the sources do not support the claim, return FAIL.

Return your response in exactly this format:

RESULT: PASS

FEEDBACK: <Explain briefly why the claim is supported
by the provided sources.>

OR:

RESULT: FAIL

FEEDBACK: <Explain specifically which claim is not
supported by the provided sources.>

---------------- SOURCE CONTEXT ----------------

{state.get("context", "")}

---------------- CONTENT TO CHECK ----------------

{content_to_check}

---------------- END ----------------
"""

    result = generate_text(
        prompt
    ).strip()

    # --------------------------------
    # Parse result
    # --------------------------------

    if "RESULT: PASS" in result:
        fact_check_result = "PASS"

    elif "RESULT: FAIL" in result:
        fact_check_result = "FAIL"

    else:
        fact_check_result = "FAIL"

    return {
        **state,
        "fact_check_result": fact_check_result,
        "fact_check_feedback": result,
    }
    
def route_after_retriever(
    state: GenerationState,
) -> str:
    workflow = state.get(
        "workflow",
        "generation",
    )

    if workflow == "research":
        return "research"

    if workflow == "fact_check":
        return "fact_check"

    return "writer"
    
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