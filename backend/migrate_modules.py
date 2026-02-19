import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid

# Load env vars
load_dotenv('.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

if not MONGO_URL or not DB_NAME:
    print("Error: MONGO_URL or DB_NAME not set in .env")
    exit(1)

async def migrate():
    print("Starting migration: Single Video -> Multi-Item Modules...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    courses = await db.courses.find({}).to_list(None)
    
    count = 0
    for course in courses:
        updated = False
        new_modules = []
        
        for module in course.get('modules', []):
            # Check if already migrated
            if 'items' in module and len(module['items']) > 0:
                new_modules.append(module)
                continue
            
            # Create new items list
            items = []
            
            # Migrate existing video_url if present
            video_url = module.get('video_url')
            if video_url:
                print(f"Migrating video for module: {module.get('title')}")
                items.append({
                    "id": str(uuid.uuid4()),
                    "title": module.get('title', 'Lesson'), # Use module title as lesson title
                    "type": "video",
                    "url": video_url,
                    "duration_minutes": module.get('duration_minutes', 10),
                    "is_free": False
                })
                updated = True
            
            # Update module structure
            # We keep video_url for safety/backward compat if needed, but 'items' is the new source of truth
            module['items'] = items
            new_modules.append(module)
        
        if updated:
            await db.courses.update_one(
                {"_id": course["_id"]},
                {"$set": {"modules": new_modules}}
            )
            count += 1
            print(f"Updated course: {course.get('title')}")
            
    print(f"Migration complete. Updated {count} courses.")

if __name__ == "__main__":
    asyncio.run(migrate())
