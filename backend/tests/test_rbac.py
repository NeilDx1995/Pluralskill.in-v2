"""
RBAC (Role-Based Access Control) Tests for PluralSkill LMS
Tests Admin, Trainer, and Learner role permissions
"""

import os

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
ADMIN_EMAIL = "admin@pluralskill.com"
ADMIN_PASSWORD = "admin123"
TRAINER_EMAIL = "trainer@pluralskill.com"
TRAINER_PASSWORD = "trainer123"


class TestHealthCheck:
    """Basic health check tests"""

    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("SUCCESS: API health check passed")


class TestAdminLogin:
    """Test Admin login and role verification"""

    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"SUCCESS: Admin login successful, role={data['user']['role']}")
        return data["token"]

    def test_admin_can_access_admin_stats(self):
        """Test admin can access /api/admin/stats"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        token = login_response.json()["token"]

        # Access admin stats
        response = requests.get(
            f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_courses" in data
        assert "total_trainers" in data
        print(f"SUCCESS: Admin can access /api/admin/stats - {data}")

    def test_admin_can_access_trainer_courses(self):
        """Test admin can access /api/trainer/courses"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        token = login_response.json()["token"]

        response = requests.get(
            f"{BASE_URL}/api/trainer/courses",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(
            f"SUCCESS: Admin can access /api/trainer/courses - found {len(data)} courses"
        )


class TestTrainerLogin:
    """Test Trainer login and role verification"""

    def test_trainer_login_success(self):
        """Test trainer can login successfully"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRAINER_EMAIL, "password": TRAINER_PASSWORD},
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "trainer"
        assert data["user"]["email"] == TRAINER_EMAIL
        print(f"SUCCESS: Trainer login successful, role={data['user']['role']}")
        return data["token"]

    def test_trainer_can_access_trainer_courses(self):
        """Test trainer can access /api/trainer/courses"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRAINER_EMAIL, "password": TRAINER_PASSWORD},
        )
        token = login_response.json()["token"]

        response = requests.get(
            f"{BASE_URL}/api/trainer/courses",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(
            f"SUCCESS: Trainer can access /api/trainer/courses - found {len(data)} courses"
        )

    def test_trainer_cannot_access_admin_stats(self):
        """Test trainer CANNOT access /api/admin/stats (403 Forbidden)"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRAINER_EMAIL, "password": TRAINER_PASSWORD},
        )
        token = login_response.json()["token"]

        response = requests.get(
            f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"SUCCESS: Trainer correctly denied access to /api/admin/stats (403)")

    def test_trainer_cannot_access_admin_users(self):
        """Test trainer CANNOT access /api/admin/users (403 Forbidden)"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRAINER_EMAIL, "password": TRAINER_PASSWORD},
        )
        token = login_response.json()["token"]

        response = requests.get(
            f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"SUCCESS: Trainer correctly denied access to /api/admin/users (403)")


class TestTrainerCourseCreation:
    """Test Trainer can create courses"""

    def test_trainer_create_course(self):
        """Test trainer can create a new course"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRAINER_EMAIL, "password": TRAINER_PASSWORD},
        )
        token = login_response.json()["token"]

        # Create a test course
        course_data = {
            "title": "TEST_Trainer Course RBAC Test",
            "slug": "test-trainer-course-rbac",
            "description": "Test course created by trainer for RBAC testing",
            "short_description": "RBAC test course",
            "thumbnail_url": "https://example.com/test.jpg",
            "category": "Testing",
            "industry": "QA",
            "level": "beginner",
            "duration_hours": 5,
            "price": 0,
            "is_published": False,
            "learning_outcomes": ["Test RBAC"],
        }

        response = requests.post(
            f"{BASE_URL}/api/trainer/courses",
            headers={"Authorization": f"Bearer {token}"},
            json=course_data,
        )

        # Accept both 200 and 201 as success
        assert response.status_code in [
            200,
            201,
        ], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["title"] == course_data["title"]
        assert "id" in data
        print(f"SUCCESS: Trainer created course with id={data['id']}")

        # Cleanup - delete the test course
        course_id = data["id"]
        delete_response = requests.delete(
            f"{BASE_URL}/api/trainer/courses/{course_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert delete_response.status_code == 200
        print(f"SUCCESS: Test course cleaned up")


class TestLearnerSignupAndAccess:
    """Test Learner signup and access restrictions"""

    def test_signup_new_learner(self):
        """Test new user signup gets learner role"""
        import uuid

        unique_email = f"test_learner_{uuid.uuid4().hex[:8]}@test.com"

        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "Learner",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "learner"
        print(f"SUCCESS: New user signup gets learner role - {unique_email}")
        return data["token"], unique_email

    def test_learner_cannot_access_trainer_courses(self):
        """Test learner CANNOT access /api/trainer/courses (403 Forbidden)"""
        import uuid

        unique_email = f"test_learner_{uuid.uuid4().hex[:8]}@test.com"

        # Signup new learner
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "Learner",
            },
        )
        token = signup_response.json()["token"]

        # Try to access trainer courses
        response = requests.get(
            f"{BASE_URL}/api/trainer/courses",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"SUCCESS: Learner correctly denied access to /api/trainer/courses (403)")

    def test_learner_cannot_access_admin_stats(self):
        """Test learner CANNOT access /api/admin/stats (403 Forbidden)"""
        import uuid

        unique_email = f"test_learner_{uuid.uuid4().hex[:8]}@test.com"

        # Signup new learner
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "Learner",
            },
        )
        token = signup_response.json()["token"]

        # Try to access admin stats
        response = requests.get(
            f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"SUCCESS: Learner correctly denied access to /api/admin/stats (403)")

    def test_learner_can_access_public_courses(self):
        """Test learner CAN access public /api/courses"""
        import uuid

        unique_email = f"test_learner_{uuid.uuid4().hex[:8]}@test.com"

        # Signup new learner
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "Learner",
            },
        )
        token = signup_response.json()["token"]

        # Access public courses
        response = requests.get(
            f"{BASE_URL}/api/courses", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(
            f"SUCCESS: Learner can access public /api/courses - found {len(data)} courses"
        )


class TestUnauthenticatedAccess:
    """Test unauthenticated access restrictions"""

    def test_unauthenticated_cannot_access_admin_stats(self):
        """Test unauthenticated user cannot access /api/admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print(f"SUCCESS: Unauthenticated user denied access to /api/admin/stats (401)")

    def test_unauthenticated_cannot_access_trainer_courses(self):
        """Test unauthenticated user cannot access /api/trainer/courses"""
        response = requests.get(f"{BASE_URL}/api/trainer/courses")
        assert response.status_code == 401
        print(
            f"SUCCESS: Unauthenticated user denied access to /api/trainer/courses (401)"
        )

    def test_unauthenticated_can_access_public_courses(self):
        """Test unauthenticated user CAN access public /api/courses"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Unauthenticated user can access public /api/courses")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
