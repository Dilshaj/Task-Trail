import asyncio
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def fix_task_projects():
    # Load environment variables
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")

    if not mongo_uri:
        logger.error("MONGO_URI not found in .env file")
        return

    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    logger.info(f"Connected to database: {db_name}")

    # 1. Fetch all projects and create a mapping
    projects_cursor = db["Projects"].find({})
    projects = await projects_cursor.to_list(length=1000)
    project_map = {str(p["_id"]): p["name"] for p in projects}
    
    logger.info(f"Loaded {len(project_map)} projects for mapping.")

    # 2. Iterate through all tasks
    tasks_cursor = db["Tasks"].find({})
    tasks = await tasks_cursor.to_list(length=5000)
    
    logger.info(f"Found {len(tasks)} tasks to process.")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0

    for task in tasks:
        task_id = task["_id"]
        # Check for project_id in multiple possible fields
        pid = task.get("project_id") or task.get("projectId")
        current_name = task.get("project_name") or task.get("projectName")
        
        if not pid:
            logger.warning(f"Task {task_id} has no project_id. Skipping.")
            skipped_count += 1
            continue
            
        pid_str = str(pid)
        target_name = project_map.get(pid_str)
        
        if not target_name:
            logger.warning(f"Project ID {pid_str} (Task {task_id}) not found in Projects collection.")
            skipped_count += 1
            continue
            
        # Only update if name is missing or different
        if current_name != target_name:
            try:
                await db["Tasks"].update_one(
                    {"_id": task_id},
                    {"$set": {
                        "project_name": target_name,
                        "project_id": pid_str # Standardize to string project_id
                    }}
                )
                logger.info(f"Updated Task {task_id}: {current_name} -> {target_name}")
                updated_count += 1
            except Exception as e:
                logger.error(f"Failed to update Task {task_id}: {e}")
                error_count += 1
        else:
            skipped_count += 1

    logger.info("--- Migration Summary ---")
    logger.info(f"Total Tasks: {len(tasks)}")
    logger.info(f"Updated: {updated_count}")
    logger.info(f"Skipped/Correct: {skipped_count}")
    logger.info(f"Errors: {error_count}")
    logger.info("--------------------------")

    client.close()

if __name__ == "__main__":
    asyncio.run(fix_task_projects())
