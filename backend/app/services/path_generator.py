import networkx as nx
from typing import List, Dict, Any, Set
from app.services.db import db
from app.models.schemas import RoadmapStep, ResourceInfo


def build_prerequisite_graph() -> nx.DiGraph:
    """Builds a Directed Acyclic Graph (DAG) from prerequisite edges."""
    g = nx.DiGraph()
    
    # Add all skills as nodes
    skills = db.list_documents("skills")
    for s in skills:
        g.add_node(s["skill_id"], name=s["name"], description=s.get("description", ""))

    # Add prerequisite directed edges: from_skill -> to_skill
    prereqs = db.list_documents("prerequisites")
    for p in prereqs:
        from_id = p.get("from_skill_id")
        to_id = p.get("to_skill_id")
        if from_id and to_id:
            g.add_edge(from_id, to_id)

    return g


def generate_learning_path(
    missing_skill_ids: List[str],
    current_skill_ids: List[str],
    gap_scores: Dict[str, float] = None
) -> List[RoadmapStep]:
    """
    Generates a topologically sorted learning path respecting prerequisites.
    Includes prerequisite closure for any upstream dependencies required.
    """
    if gap_scores is None:
        gap_scores = {}

    g = build_prerequisite_graph()
    all_skills = db.list_documents("skills")
    all_resources = db.list_documents("resources")
    
    skill_map = {s["skill_id"]: s for s in all_skills}
    name_to_id = {s["name"].lower(): s["skill_id"] for s in all_skills}

    # Normalize missing skill IDs
    target_ids: Set[str] = set()
    for item in missing_skill_ids:
        if item in skill_map:
            target_ids.add(item)
        elif item.lower() in name_to_id:
            target_ids.add(name_to_id[item.lower()])

    # Normalize current skill IDs
    mastered_ids: Set[str] = set()
    for item in current_skill_ids:
        if item in skill_map:
            mastered_ids.add(item)
        elif item.lower() in name_to_id:
            mastered_ids.add(name_to_id[item.lower()])

    # Find prerequisite closure (ancestors needed)
    required_closure: Set[str] = set(target_ids)
    for s_id in list(target_ids):
        if s_id in g:
            ancestors = nx.ancestors(g, s_id)
            for anc in ancestors:
                if anc not in mastered_ids:
                    required_closure.add(anc)

    # Subgraph for the closure
    subgraph = g.subgraph(required_closure)

    # Topological sort over the DAG
    try:
        ordered_skill_ids = list(nx.topological_sort(subgraph))
    except nx.NetworkXUnfeasible:
        # Fallback if a cycle were introduced
        ordered_skill_ids = list(required_closure)

    # Group resources by skill_id
    resources_by_skill: Dict[str, List[Dict[str, Any]]] = {}
    for r in all_resources:
        s_id = r.get("skill_id")
        if s_id not in resources_by_skill:
            resources_by_skill[s_id] = []
        resources_by_skill[s_id].append(r)

    roadmap_steps: List[RoadmapStep] = []
    step_num = 1

    for s_id in ordered_skill_ids:
        s_data = skill_map.get(s_id, {"name": s_id})
        s_name = s_data.get("name", s_id)
        
        # Determine direct prerequisites within this graph
        direct_prereqs = []
        if s_id in g:
            for pred in g.predecessors(s_id):
                pred_name = skill_map.get(pred, {}).get("name", pred)
                direct_prereqs.append(pred_name)

        # Select best primary resource
        res_list = resources_by_skill.get(s_id, [])
        primary_res = next((r for r in res_list if not r.get("is_remedial") and r.get("type") == "course"), None)
        if not primary_res and res_list:
            primary_res = res_list[0]
        
        if primary_res:
            res_info = ResourceInfo(
                resource_id=primary_res["resource_id"],
                title=primary_res["title"],
                url=primary_res["url"],
                type=primary_res.get("type", "course"),
                is_remedial=primary_res.get("is_remedial", False)
            )
        else:
            res_info = ResourceInfo(
                resource_id=f"res_{s_id}_default",
                title=f"Mastering {s_name}: Practical Guide",
                url="https://developer.mozilla.org",
                type="course",
                is_remedial=False
            )

        step = RoadmapStep(
            step_id=f"step_{step_num}_{s_id}",
            step=step_num,
            skill_id=s_id,
            skill_name=s_name,
            resource=res_info,
            type=res_info.type,
            status="not_started" if step_num > 1 else "in_progress",
            explanation="",  # Will be populated by XAI service
            is_remedial=False,
            prerequisites=direct_prereqs,
            gap_score=gap_scores.get(s_name, gap_scores.get(s_id, 0.0))
        )
        roadmap_steps.append(step)
        step_num += 1

    return roadmap_steps
