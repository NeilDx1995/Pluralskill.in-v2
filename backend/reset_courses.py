import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pluralskill")


async def reset_courses():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Check if collection exists
    collections = await db.list_collection_names()
    if "courses" in collections:
        print("Dropping courses collection...")
        await db.courses.drop()
        print("Courses collection dropped.")
    else:
        print("Courses collection does not exist.")


if __name__ == "__main__":
    asyncio.run(reset_courses())
