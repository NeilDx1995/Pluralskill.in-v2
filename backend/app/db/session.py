from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URL)
        self.db = self.client[settings.DB_NAME]
        print(f"Connected to MongoDB: {settings.DB_NAME}")

    def close(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

    def __getattr__(self, name):
        """Proxy collection access: db.users -> db.db['users']"""
        if name in ("client", "db"):
            raise AttributeError(name)
        if self.db is not None:
            return self.db[name]
        raise AttributeError(f"Database not connected. Call connect() first.")

db = Database()

# Dependency to get DB instance (if needed in routes, though direct access to db.db is common in simple apps)
async def get_db():
    return db.db
