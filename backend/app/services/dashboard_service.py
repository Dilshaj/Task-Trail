from app.db.mongo import db
from datetime import datetime, timezone, timedelta

async def get_admin_dashboard_stats(project_id: str = None):
    """
    Calculates key metrics for the admin overview using MongoDB aggregations.
    If project_id is provided, filters metrics for that specific project.
    """
    if db.db is None:
        return {"projects": 0, "employees": 0, "tasks": {"completed": 0, "total": 0}, "attendance": {"total": 0, "today": 0}}
    query = {}
    if project_id:
        query["project_id"] = project_id
        # Also need to filter employees by project if project_id is provided
        emp_query = {"project_id": project_id}
    else:
        emp_query = {}

    # 1. Employee Count
    total_employees = await db.employees.count_documents(emp_query)
    
    # 2. Total Projects
    if project_id:
        total_projects = 1 # We are looking at one specific project
    else:
        total_projects = await db.projects.count_documents({})

    # 3. Task Metrics (Aggregation)
    task_pipeline = []
    if project_id:
        task_pipeline.append({"$match": {"project_id": project_id}})
    
    task_pipeline.append({"$group": {"_id": "$status", "count": {"$sum": 1}}})
    
    task_counts_raw = await db.tasks.aggregate(task_pipeline).to_list(20)
    
    # Extract specific counts (handle both 'Completed' and 'done')
    task_map = {str(item["_id"]): item["count"] for item in task_counts_raw}
    completed_tasks = task_map.get("Completed", 0) + task_map.get("done", 0) + task_map.get("Completed ", 0)
    
    # 4. Attendance Statistics
    # Attendance is usually linked to employee_id
    if project_id:
        # Get all human-readable employee IDs for this project
        project_emps = await db.employees.find({"project_id": project_id}).to_list(1000)
        # Robustly collect both human-readable employee_id AND MongoDB _id string
        emp_ids = []
        for e in project_emps:
            if e.get("employee_id"): emp_ids.append(e["employee_id"])
            emp_ids.append(str(e["_id"]))
            
        att_query = {"employee_id": {"$in": emp_ids}}
    else:
        att_query = {}

    total_attendance = await db.attendance.count_documents(att_query)
    
    # Check-ins recorded today (IST)
    now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    today_str = now_ist.strftime("%Y-%m-%d")
    att_query["date"] = today_str
    today_checkins = await db.attendance.count_documents(att_query)

    return {
        "employees": total_employees,
        "projects": total_projects,
        "tasks": {
            "completed": completed_tasks,
            "total": sum(task_map.values())
        },
        "attendance": {
            "total": total_attendance,
            "today": today_checkins
        }
    }

async def get_monthly_attendance_chart(project_id: str = None):
    """
    Generates data for a 30-day activity chart using aggregation.
    Filters by project if project_id is provided.
    """
    if db.db is None:
        return []
        
    query = {}
    if project_id:
        # Get all human-readable employee IDs for this project
        project_emps = await db.employees.find({"project_id": project_id}).to_list(1000)
        emp_ids = []
        for e in project_emps:
            if e.get("employee_id"): emp_ids.append(e["employee_id"])
            emp_ids.append(str(e["_id"]))
        query["employee_id"] = {"$in": emp_ids}

    chart_pipeline = []
    if query:
        chart_pipeline.append({"$match": query})
        
    chart_pipeline.extend([
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$limit": 30}
    ])
    
    chart_data = await db.attendance.aggregate(chart_pipeline).to_list(30)
    return [{"date": item["_id"], "count": item["count"]} for item in chart_data]
