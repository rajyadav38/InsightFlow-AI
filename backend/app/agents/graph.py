from langgraph.graph import (
    END,
    START,
    StateGraph,
)

from app.agents.nodes import (
    fact_checker_node,
    research_node,
    retriever_node,
    route_after_fact_check,
    route_after_retriever,
    route_after_supervisor,
    supervisor_node,
    writer_node,
)

from app.agents.state import GenerationState


def build_generation_graph():

    graph = StateGraph(GenerationState)

    # -----------------------------
    # ADD NODES
    # -----------------------------

    graph.add_node(
        "supervisor",
        supervisor_node,
    )

    graph.add_node(
        "retriever",
        retriever_node,
    )

    graph.add_node(
        "research",
        research_node,
    )

    graph.add_node(
        "writer",
        writer_node,
    )

    graph.add_node(
        "fact_checker",
        fact_checker_node,
    )

    # -----------------------------
    # START
    # -----------------------------

    graph.add_edge(
        START,
        "supervisor",
    )

    # -----------------------------
    # SUPERVISOR ROUTING
    # -----------------------------

    graph.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {
            "generation": "retriever",
            "research": "retriever",
            "fact_check": "retriever",
        },
    )

    # -----------------------------
    # RETRIEVER ROUTING
    # -----------------------------

    graph.add_conditional_edges(
        "retriever",
        route_after_retriever,
        {
            "research": "research",
            "fact_check": "fact_checker",
            "writer": "writer",
        },
    )

    # -----------------------------
    # RESEARCH → WRITER
    # -----------------------------

    graph.add_edge(
        "research",
        "writer",
    )

    # -----------------------------
    # WRITER → FACT CHECKER
    # -----------------------------

    graph.add_edge(
        "writer",
        "fact_checker",
    )

    # -----------------------------
    # FACT CHECKER ROUTING
    # -----------------------------

    graph.add_conditional_edges(
        "fact_checker",
        route_after_fact_check,
        {
            "revise": "writer",
            "end": END,
        },
    )

    return graph.compile()


generation_graph = build_generation_graph()