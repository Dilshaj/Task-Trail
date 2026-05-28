import re
from typing import Dict


def _to_text(value) -> str:
    return str(value or "").strip().lower()


def is_employee_in_domain(employee_role: str, domain: str) -> bool:
    role = _to_text(employee_role)
    dom = _to_text(domain)

    if not dom:
        return False

    # Canonical domain checks used for DOMAIN_LEAD scoping.
    if dom in {"developer", "developers"}:
        return bool(re.search(r"\bdevelop|devlop\b", role)) and "python" not in role
    if dom in {"python", "python developer", "python developers"}:
        return "python" in role
    if dom in {"data analyst", "data analysts", "analyst", "analysts"}:
        return "analyst" in role
    if dom == "devops":
        return "devops" in role
    if dom in {"cyber security", "cybersecurity", "security"}:
        return "security" in role
    if dom in {"uiux", "ui/ux", "uiux design", "ui/ux design", "design", "designer"}:
        return any(k in role for k in ["uiux", "ui/ux", "design", "designer"])
    if dom in {"non-it", "non_it", "non it", "others"}:
        return not any(k in role for k in ["develop", "devlop", "python", "analyst", "devops", "security", "design", "uiux", "ui/ux"])

    # Fallback: permissive contains check for custom domains.
    return dom in role


def apply_domain_filter_to_query(query: Dict, domain: str) -> Dict:
    dom = _to_text(domain)
    if not dom:
        return query

    if dom in {"developer", "developers"}:
        query["role"] = {"$regex": r"^(?!.*python)(?:.*develop|.*devlop)", "$options": "i"}
    elif dom in {"python", "python developer", "python developers"}:
        query["role"] = {"$regex": "python", "$options": "i"}
    elif dom in {"data analyst", "data analysts", "analyst", "analysts"}:
        query["role"] = {"$regex": "analyst", "$options": "i"}
    elif dom == "devops":
        query["role"] = {"$regex": "devops", "$options": "i"}
    elif dom in {"cyber security", "cybersecurity", "security"}:
        query["role"] = {"$regex": "security", "$options": "i"}
    elif dom in {"uiux", "ui/ux", "uiux design", "ui/ux design", "design", "designer"}:
        query["role"] = {"$regex": "ui/ux|uiux|design|designer", "$options": "i"}
    elif dom in {"non-it", "non_it", "non it", "others"}:
        query["role"] = {"$not": {"$regex": "develop|devlop|analyst|devops|security|python|design|designer|uiux|ui/ux", "$options": "i"}}
    else:
        query["role"] = {"$regex": re.escape(domain), "$options": "i"}
    return query

