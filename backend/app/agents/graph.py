from langgraph.graph import (
    END,
    START,
    StateGraph,
)

from app.agents.nodes import (
    fact_checker_node,
    retriever_node,
    route_after_fact_check,
    supervisor_node,
    writer_node,
)
from app.agents.state import GenerationState


def build_generation_graph():

    graph = StateGraph(
        GenerationState
    )

    # -----------------------------------------
    # Nodes
    # -----------------------------------------

    graph.add_node(
        "supervisor",
        supervisor_node,
    )

    graph.add_node(
        "retriever",
        retriever_node,
    )

    graph.add_node(
        "writer",
        writer_node,
    )

    graph.add_node(
        "fact_checker",
        fact_checker_node,
    )

    # -----------------------------------------
    # Edges
    # -----------------------------------------

    graph.add_edge(
        START,
        "supervisor",
    )

    graph.add_edge(
        "supervisor",
        "retriever",
    )

    graph.add_edge(
        "retriever",
        "writer",
    )

    graph.add_edge(
        "writer",
        "fact_checker",
    )

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