import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pluralskill")

async def reset_labs():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Check if collection exists
    collections = await db.list_collection_names()
    if "labs" in collections:
        print("Dropping labs collection...")
        await db.labs.drop()
        print("Labs collection dropped.")
    else:
        print("Labs collection does not exist.")

if __name__ == "__main__":
    asyncio.run(reset_labs())
