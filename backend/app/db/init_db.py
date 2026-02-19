import logging
from app.core.config import settings
from app.db.session import db
from datetime import datetime, timezone
import uuid
import bcrypt

logger = logging.getLogger(__name__)

async def init_db():
    try:
        # Create indexes
        await db.db.users.create_index("email", unique=True)
        await db.db.users.create_index("id", unique=True)
        await db.db.courses.create_index("slug", unique=True)
        await db.db.courses.create_index("id", unique=True)
        await db.db.courses.create_index("category")
        await db.db.courses.create_index("level")
        await db.db.courses.create_index("is_published")
        await db.db.labs.create_index("slug", unique=True)
        await db.db.labs.create_index("id", unique=True)
        await db.db.labs.create_index("difficulty")
        await db.db.workshops.create_index("id", unique=True)
        await db.db.workshops.create_index("is_active")
        await db.db.course_progress.create_index([("user_id", 1), ("course_id", 1)], unique=True)
        await db.db.certificates.create_index("user_id")
        await db.db.certificates.create_index("certificate_number", unique=True, sparse=True)
        await db.db.learning_paths.create_index("user_id")
        await db.db.analytics.create_index([("user_id", 1), ("resource_type", 1)])
        
        # Check if admin exists
        admin = await db.db.users.find_one({"email": "admin@pluralskill.in"})
        if not admin:
            logger.info("Creating initial admin user")
            password = "adminpassword"
            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            now = datetime.now(timezone.utc).isoformat()
            
            admin_doc = {
                "id": str(uuid.uuid4()),
                "email": "admin@pluralskill.in",
                "password_hash": hashed_pw,
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            await db.db.users.insert_one(admin_doc)
            logger.info("Admin user created")
            
        # Check if trainer exists
        trainer = await db.db.users.find_one({"email": "trainer@pluralskill.com"})
        if not trainer:
            logger.info("Creating trainer user")
            password = "trainer123"
            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            now = datetime.now(timezone.utc).isoformat()
            
            trainer_doc = {
                "id": str(uuid.uuid4()),
                "email": "trainer@pluralskill.com",
                "password_hash": hashed_pw,
                "first_name": "Sarah",
                "last_name": "Trainer",
                "bio": "Course Instructor", 
                "skills": ["Excel", "Power BI", "Python"],
                "role": "trainer",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            await db.db.users.insert_one(trainer_doc)
            logger.info("Trainer user created")

        # Seed Workshops
        workshop_count = await db.db.workshops.count_documents({})
        if workshop_count == 0:
            logger.info("Seeding workshops...")
            admin = await db.db.users.find_one({"email": "admin@pluralskill.in"})
            admin_id = admin["id"] if admin else "system"
            now = datetime.now(timezone.utc).isoformat()
            
            workshops = [
                {
                    "id": str(uuid.uuid4()),
                    "title": "AI in Finance: Transforming FP&A with Machine Learning",
                    "slug": "ai-in-finance-fpa-ml",
                    "description": "Learn how leading financial institutions are leveraging AI for forecasting, risk assessment, and automated reporting.",
                    "speakers": [
                        {"name": "Sarah Chen", "title": "VP of AI Strategy", "company": "Goldman Sachs", "linkedin_url": "", "bio": "Leading AI transformation in financial planning"}
                    ],
                    "date": "2026-02-15",
                    "duration_minutes": 90,
                    "platform": "Virtual",
                    "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
                    "recording_url": "",
                    "tags": ["Finance", "AI", "Machine Learning"],
                    "max_participants": 500,
                    "registered_count": 0,
                    "is_active": True,
                    "created_by": admin_id,
                    "created_at": now
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": "Building Data-Driven HR: From Analytics to Action",
                    "slug": "data-driven-hr-analytics",
                    "description": "Industry leaders share how they use people analytics to drive retention and strategic workforce planning.",
                    "speakers": [
                        {"name": "Jennifer Williams", "title": "Chief People Officer", "company": "Microsoft", "linkedin_url": "", "bio": "Pioneer in people analytics and workforce strategy"}
                    ],
                    "date": "2026-02-22",
                    "duration_minutes": 75,
                    "platform": "Virtual",
                    "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
                    "recording_url": "",
                    "tags": ["HR", "People Analytics"],
                    "max_participants": 300,
                    "registered_count": 0,
                    "is_active": True,
                    "created_by": admin_id,
                    "created_at": now
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": "Supply Chain Resilience: Lessons from Industry Leaders",
                    "slug": "supply-chain-resilience",
                    "description": "Executives discuss how they built resilient supply chains using data analytics and AI.",
                    "speakers": [
                        {"name": "David Kim", "title": "SVP Supply Chain", "company": "Amazon", "linkedin_url": "", "bio": "Leading logistics innovation with data-driven strategies"}
                    ],
                    "date": "2026-03-01",
                    "duration_minutes": 90,
                    "platform": "Virtual",
                    "image_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
                    "recording_url": "",
                    "tags": ["Supply Chain", "Operations"],
                    "max_participants": 400,
                    "registered_count": 0,
                    "is_active": True,
                    "created_by": admin_id,
                    "created_at": now
                }
            ]
            
            await db.db.workshops.insert_many(workshops)
            logger.info(f"Seeded {len(workshops)} workshops")
            
    except Exception as e:
        logger.error(f"DB Initialization failed: {e}")
