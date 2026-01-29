#!/usr/bin/env python3
"""
PluralSkill LMS Backend API Test Suite
Tests all major API endpoints for functionality and integration
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class PluralSkillAPITester:
    def __init__(self, base_url: str = "https://course-hub-93.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_course_id = None
        self.test_workshop_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 token: Optional[str] = None) -> tuple:
        """Run a single API test and return success status and response"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
            
        self.tests_run += 1
        self.log(f"Testing {name}... ({method} {endpoint})")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                    
                self.log(f"❌ FAILED - {error_msg}", "FAIL")
                self.failed_tests.append({
                    'test': name,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'error': error_msg
                })
                return False, {}
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ FAILED - Network error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'test': name,
                'endpoint': endpoint,
                'error': f"Network error: {str(e)}"
            })
            return False, {}
        except Exception as e:
            self.log(f"❌ FAILED - Unexpected error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'test': name,
                'endpoint': endpoint,
                'error': f"Unexpected error: {str(e)}"
            })
            return False, {}

    def test_health_endpoints(self):
        """Test basic health and connectivity"""
        self.log("=== Testing Health Endpoints ===")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "health", 200)

    def test_admin_authentication(self):
        """Test admin login and get token"""
        self.log("=== Testing Admin Authentication ===")
        
        admin_credentials = {
            "email": "admin@pluralskill.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login", "POST", "auth/login", 200, 
            data=admin_credentials
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"✅ Admin token obtained successfully")
            return True
        else:
            self.log("❌ Failed to get admin token - cannot continue admin tests")
            return False

    def test_user_registration_and_login(self):
        """Test user signup and login flow"""
        self.log("=== Testing User Registration & Login ===")
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_user = {
            "email": f"testuser{timestamp}@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        # Test user signup
        success, response = self.run_test(
            "User Signup", "POST", "auth/signup", 200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.user_token = response['token']
            self.test_user_id = response['user']['id']
            self.log(f"✅ User registered and token obtained")
        else:
            self.log("❌ User registration failed")
            return False
            
        # Test user login
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        success, response = self.run_test(
            "User Login", "POST", "auth/login", 200,
            data=login_data
        )
        
        return success

    def test_user_profile_endpoints(self):
        """Test user profile management"""
        if not self.user_token:
            self.log("⚠️ Skipping profile tests - no user token")
            return
            
        self.log("=== Testing User Profile Endpoints ===")
        
        # Test get current user
        self.run_test(
            "Get Current User", "GET", "auth/me", 200,
            token=self.user_token
        )
        
        # Test get profile
        self.run_test(
            "Get User Profile", "GET", "users/profile", 200,
            token=self.user_token
        )
        
        # Test update profile
        profile_update = {
            "bio": "Updated test bio",
            "skills": ["Python", "Testing"]
        }
        
        self.run_test(
            "Update Profile", "PUT", "users/profile", 200,
            data=profile_update, token=self.user_token
        )

    def test_course_endpoints(self):
        """Test course-related endpoints"""
        self.log("=== Testing Course Endpoints ===")
        
        # Test get courses (public)
        success, response = self.run_test(
            "Get Published Courses", "GET", "courses", 200
        )
        
        if success and response:
            courses = response
            if courses:
                # Test get course by slug
                first_course = courses[0]
                self.run_test(
                    "Get Course by Slug", "GET", f"courses/{first_course['slug']}", 200
                )
                
                # Test course enrollment (requires user token)
                if self.user_token:
                    enroll_data = {"course_id": first_course['id']}
                    self.run_test(
                        "Enroll in Course", "POST", "courses/enroll", 200,
                        data=enroll_data, token=self.user_token
                    )
                    
                    # Test get my courses
                    self.run_test(
                        "Get My Courses", "GET", "my-courses", 200,
                        token=self.user_token
                    )

    def test_admin_stats_and_users(self):
        """Test admin dashboard endpoints"""
        if not self.admin_token:
            self.log("⚠️ Skipping admin tests - no admin token")
            return
            
        self.log("=== Testing Admin Endpoints ===")
        
        # Test admin stats
        self.run_test(
            "Get Admin Stats", "GET", "admin/stats", 200,
            token=self.admin_token
        )
        
        # Test get all users
        self.run_test(
            "Get All Users", "GET", "admin/users", 200,
            token=self.admin_token
        )
        
        # Test get all courses (admin view)
        self.run_test(
            "Get All Courses (Admin)", "GET", "admin/courses", 200,
            token=self.admin_token
        )

    def test_admin_course_crud(self):
        """Test admin course CRUD operations"""
        if not self.admin_token:
            self.log("⚠️ Skipping course CRUD tests - no admin token")
            return
            
        self.log("=== Testing Admin Course CRUD ===")
        
        # Create test course
        timestamp = datetime.now().strftime("%H%M%S")
        test_course = {
            "title": f"Test Course {timestamp}",
            "slug": f"test-course-{timestamp}",
            "description": "This is a test course created by automated testing",
            "short_description": "Test course for API validation",
            "thumbnail_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
            "category": "Testing",
            "level": "beginner",
            "duration_hours": 5,
            "price": 0,
            "modules": [
                {
                    "title": "Test Module 1",
                    "description": "First test module",
                    "duration_minutes": 30
                }
            ],
            "is_published": True
        }
        
        success, response = self.run_test(
            "Create Course", "POST", "admin/courses", 201,
            data=test_course, token=self.admin_token
        )
        
        if success and 'id' in response:
            self.test_course_id = response['id']
            
            # Test update course
            update_data = {
                "title": f"Updated Test Course {timestamp}",
                "description": "Updated description"
            }
            
            self.run_test(
                "Update Course", "PUT", f"admin/courses/{self.test_course_id}", 200,
                data=update_data, token=self.admin_token
            )
            
            # Test delete course
            self.run_test(
                "Delete Course", "DELETE", f"admin/courses/{self.test_course_id}", 200,
                token=self.admin_token
            )

    def test_workshop_endpoints(self):
        """Test workshop-related endpoints"""
        self.log("=== Testing Workshop Endpoints ===")
        
        # Test get workshops
        success, response = self.run_test(
            "Get Active Workshops", "GET", "workshops", 200
        )
        
        # Verify workshop structure includes speakers and company info
        if success and response:
            workshops = response
            if workshops:
                first_workshop = workshops[0]
                required_fields = ['id', 'title', 'description', 'speakers', 'date', 'duration_minutes']
                missing_fields = [field for field in required_fields if field not in first_workshop]
                if missing_fields:
                    self.log(f"⚠️ Workshop missing fields: {missing_fields}")
                else:
                    self.log("✅ Workshop structure validated")
                    
                # Check speaker structure
                if 'speakers' in first_workshop and first_workshop['speakers']:
                    speaker = first_workshop['speakers'][0]
                    speaker_fields = ['name', 'title', 'company', 'company_logo', 'avatar_url']
                    missing_speaker_fields = [field for field in speaker_fields if field not in speaker]
                    if missing_speaker_fields:
                        self.log(f"⚠️ Speaker missing fields: {missing_speaker_fields}")
                    else:
                        self.log("✅ Speaker structure validated")
        
        if self.admin_token:
            # Test create workshop with proper speaker structure
            timestamp = datetime.now().strftime("%H%M%S")
            test_workshop = {
                "title": f"Test Workshop {timestamp}",
                "description": "Automated test workshop",
                "speakers": [
                    {
                        "name": "Test Speaker",
                        "title": "Senior Engineer",
                        "company": "Test Company",
                        "company_logo": "https://logo.clearbit.com/google.com",
                        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
                        "linkedin": "https://linkedin.com"
                    }
                ],
                "date": "2026-03-15T18:00:00Z",
                "duration_minutes": 90,
                "max_participants": 25,
                "platform": "Instagram Live",
                "tags": ["Testing", "API"],
                "is_active": True
            }
            
            success, response = self.run_test(
                "Create Workshop", "POST", "admin/workshops", 201,
                data=test_workshop, token=self.admin_token
            )
            
            if success and 'id' in response:
                self.test_workshop_id = response['id']
                
                # Test delete workshop
                self.run_test(
                    "Delete Workshop", "DELETE", f"admin/workshops/{self.test_workshop_id}", 200,
                    token=self.admin_token
                )

    def test_authentication_security(self):
        """Test authentication and authorization"""
        self.log("=== Testing Authentication Security ===")
        
        # Test accessing protected endpoint without token
        self.run_test(
            "Access Protected Endpoint (No Token)", "GET", "auth/me", 401
        )
        
        # Test accessing admin endpoint with user token
        if self.user_token:
            self.run_test(
                "Access Admin Endpoint (User Token)", "GET", "admin/stats", 403,
                token=self.user_token
            )
        
        # Test invalid login
        invalid_credentials = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        self.run_test(
            "Invalid Login", "POST", "auth/login", 401,
            data=invalid_credentials
        )

    def run_all_tests(self):
        """Run the complete test suite"""
        self.log("🚀 Starting PluralSkill LMS API Test Suite")
        self.log(f"Testing against: {self.base_url}")
        
        # Run tests in logical order
        self.test_health_endpoints()
        
        # Authentication tests
        admin_auth_success = self.test_admin_authentication()
        self.test_user_registration_and_login()
        
        # Core functionality tests
        self.test_user_profile_endpoints()
        self.test_course_endpoints()
        self.test_workshop_endpoints()
        
        # Admin functionality tests
        if admin_auth_success:
            self.test_admin_stats_and_users()
            self.test_admin_course_crud()
        
        # Security tests
        self.test_authentication_security()
        
        # Print summary
        self.print_summary()
        
        return self.tests_passed == self.tests_run

    def print_summary(self):
        """Print test execution summary"""
        self.log("=" * 50)
        self.log("📊 TEST EXECUTION SUMMARY")
        self.log("=" * 50)
        self.log(f"Total Tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}")
        self.log(f"Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                self.log(f"{i}. {test['test']}")
                self.log(f"   Endpoint: {test.get('endpoint', 'N/A')}")
                self.log(f"   Error: {test['error']}")
                
        if self.tests_passed == self.tests_run:
            self.log("\n🎉 ALL TESTS PASSED! API is functioning correctly.")
        else:
            self.log(f"\n⚠️ {len(self.failed_tests)} tests failed. Please review the issues above.")

def main():
    """Main test execution function"""
    tester = PluralSkillAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())