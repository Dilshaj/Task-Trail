"""
Seed Project Team Leads + Domain Team Leads for EduProva and DigitalNews.

Run:
  python seed_domain_leads.py
  python seed_domain_leads.py --password "lead123"
"""
import argparse
import asyncio
import re
from datetime import datetime
from bson import ObjectId

from app.db.mongo import db
from app.services.employee_service import create_employee
from app.schemas.schemas import EmployeeCreate


PROJECTS = {
    "EduProva": {"prefix": "EDU", "aliases": ["EduProva"]},
    "Digital New": {"prefix": "DN", "aliases": ["Digital New", "DigitalNews", "Digital News"]},
}

DOMAINS = [
    ("DEV", "Developers"),
    ("PY", "Python Developer"),
    ("DA", "Data Analysts"),
    ("DO", "DevOps"),
    ("CS", "Cyber Security"),
]


async def ensure_project(project_name: str, aliases=None):
    aliases = aliases or [project_name]
    normalized = [a.strip() for a in aliases if a and a.strip()]
    pattern = "^(" + "|".join([re.escape(name) for name in normalized]) + ")$"
    project = await db.projects.find_one({"name": {"$regex": pattern, "$options": "i"}})
    if project:
        return project
    doc = {
        "name": project_name,
        "image": "",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def upsert_employee(payload: dict):
    existing = await db.employees.find_one({"employee_id": payload["employee_id"]})
    if existing:
        update = {k: v for k, v in payload.items() if k != "password"}
        await db.employees.update_one({"_id": existing["_id"]}, {"$set": update})
        return "updated"
    created = await create_employee(EmployeeCreate(**payload))
    return "created" if created else "failed"


async def seed(password: str):
    db.connect()
    if db.db is None:
        print("Database not connected.")
        return

    print("Seeding project and domain leads...")
    print("")
    for project_name, cfg in PROJECTS.items():
        project = await ensure_project(project_name, cfg.get("aliases"))
        project_id = str(project["_id"])
        project_display_name = project.get("name") or project_name
        prefix = cfg["prefix"]

        main_id = f"TL-{prefix}-MAIN"
        result = await upsert_employee({
            "employee_id": main_id,
            "name": f"{project_display_name} Main Team Lead",
            "role": "TEAM_LEAD",
            "roleType": "TEAM_LEAD",
            "project_id": project_id,
            "projectName": project_display_name,
            "email": f"{main_id.lower()}@worksheet.local",
            "password": password,
        })
        print(f"[{project_display_name}] {main_id}: {result}")

        for code, domain in DOMAINS:
            domain_id = f"DL-{prefix}-{code}"
            result = await upsert_employee({
                "employee_id": domain_id,
                "name": f"{project_display_name} {domain} Lead",
                "role": "DOMAIN_LEAD",
                "roleType": "DOMAIN_LEAD",
                "project_id": project_id,
                "projectName": project_display_name,
                "domain": domain,
                "email": f"{domain_id.lower()}@worksheet.local",
                "password": password,
            })
            print(f"[{project_display_name}] {domain_id} ({domain}): {result}")

    print("\nCredentials (Admin Login):")
    for project_name, cfg in PROJECTS.items():
        prefix = cfg["prefix"]
        print(f"- {project_name} Main Lead: TL-{prefix}-MAIN / {password}")
        for code, domain in DOMAINS:
            print(f"  - {domain}: DL-{prefix}-{code} / {password}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", default="lead123")
    args = parser.parse_args()
    asyncio.run(seed(args.password))

