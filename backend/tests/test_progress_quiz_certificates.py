"""
Test suite for PluralSkill LMS - Progress Tracking, Quiz System, Assignments, and Certificates
Tests: Module completion, Quiz submission (80% pass, 2 attempts), Assignment flow, Certificate generation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
STUDENT_EMAIL = "student@test.com"
STUDENT_PASSWORD = "student123"
TRAINER_EMAIL = "trainer@pluralskill.com"
TRAINER_PASSWORD = "trainer123"
ADMIN_EMAIL = "admin@pluralskill.com"
ADMIN_PASSWORD = "admin123"


class TestSetup:
    """Setup and helper methods"""
    
    @staticmethod
    def login(email, password):
        """Login and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    @staticmethod
    def get_auth_header(token):
        return {"Authorization": f"Bearer {token}"}


class TestStudentEnrollmentAndProgress:
    """Test student enrollment and progress tracking initialization"""
    
    def test_student_login(self):
        """Test student can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        assert response.status_code == 200, f"Student login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "learner"
        print(f"✓ Student login successful, role: {data['user']['role']}")
    
    def test_get_courses_list(self):
        """Test getting published courses"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        courses = response.json()
        assert len(courses) > 0, "No courses found"
        
        # Find Finance course
        finance_course = next((c for c in courses if "Finance" in c["title"]), None)
        assert finance_course is not None, "Finance course not found"
        assert len(finance_course.get("modules", [])) > 0, "Finance course has no modules"
        assert len(finance_course.get("tests", [])) > 0, "Finance course has no quiz questions"
        print(f"✓ Found Finance course with {len(finance_course['modules'])} modules and {len(finance_course['tests'])} quiz questions")
    
    def test_student_enrolled_courses(self):
        """Test getting student's enrolled courses"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        response = requests.get(
            f"{BASE_URL}/api/my-courses",
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 200
        courses = response.json()
        print(f"✓ Student has {len(courses)} enrolled courses")
        return courses


class TestModuleCompletion:
    """Test module completion tracking via /api/progress/module/complete"""
    
    def test_get_course_progress(self):
        """Test getting course progress for enrolled student"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        # Get enrolled courses first
        my_courses = requests.get(
            f"{BASE_URL}/api/my-courses",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(my_courses) == 0:
            pytest.skip("Student not enrolled in any courses")
        
        course_id = my_courses[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/progress/{course_id}",
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 200
        progress = response.json()
        assert "overall_progress" in progress
        assert "modules_progress" in progress
        print(f"✓ Course progress retrieved: {progress['overall_progress']}%")
    
    def test_mark_module_complete(self):
        """Test marking a module as complete"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        # Get enrolled courses
        my_courses = requests.get(
            f"{BASE_URL}/api/my-courses",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(my_courses) == 0:
            pytest.skip("Student not enrolled in any courses")
        
        course = my_courses[0]
        course_id = course["id"]
        
        # Get course details to find module IDs
        course_details = requests.get(
            f"{BASE_URL}/api/courses/{course['slug']}",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(course_details.get("modules", [])) == 0:
            pytest.skip("Course has no modules")
        
        module_id = course_details["modules"][0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/progress/module/complete",
            json={
                "course_id": course_id,
                "module_id": module_id,
                "time_spent_minutes": 30
            },
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 200
        result = response.json()
        assert "overall_progress" in result
        assert "message" in result
        print(f"✓ Module marked complete, overall progress: {result['overall_progress']}%")
    
    def test_mark_module_complete_not_enrolled(self):
        """Test that non-enrolled student cannot mark module complete"""
        # Create a new test user
        unique_email = f"test_notenrolled_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User"
        })
        
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        token = signup_response.json()["token"]
        
        # Try to mark module complete for a course they're not enrolled in
        response = requests.post(
            f"{BASE_URL}/api/progress/module/complete",
            json={
                "course_id": "some-course-id",
                "module_id": "some-module-id",
                "time_spent_minutes": 30
            },
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-enrolled student correctly denied module completion")


class TestQuizSystem:
    """Test quiz submission with score calculation (80% pass threshold, max 2 attempts)"""
    
    def test_submit_quiz_passing_score(self):
        """Test submitting quiz with passing score (80%+)"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        # Get enrolled courses
        my_courses = requests.get(
            f"{BASE_URL}/api/my-courses",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(my_courses) == 0:
            pytest.skip("Student not enrolled in any courses")
        
        course = my_courses[0]
        course_id = course["id"]
        
        # Get course details to find quiz questions
        course_details = requests.get(
            f"{BASE_URL}/api/courses/{course['slug']}",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        tests = course_details.get("tests", [])
        if len(tests) == 0:
            pytest.skip("Course has no quiz questions")
        
        # Build answers - answer all correctly to pass
        answers = {}
        for test in tests:
            answers[test["id"]] = test["correct_answer"]
        
        response = requests.post(
            f"{BASE_URL}/api/progress/quiz/submit",
            json={
                "course_id": course_id,
                "answers": answers
            },
            headers=TestSetup.get_auth_header(token)
        )
        
        # Could be 200 (success) or 400 (max attempts reached)
        if response.status_code == 400 and "attempts" in response.text.lower():
            print("✓ Quiz submission blocked - max attempts reached (expected behavior)")
            return
        
        assert response.status_code == 200, f"Quiz submission failed: {response.text}"
        result = response.json()
        assert "score" in result
        assert "passed" in result
        assert "attempts_remaining" in result
        print(f"✓ Quiz submitted: score={result['score']}%, passed={result['passed']}, attempts_remaining={result['attempts_remaining']}")
    
    def test_quiz_attempt_limit(self):
        """Test that quiz has max 2 attempts"""
        # Create a new test user for clean slate
        unique_email = f"test_quiz_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpass123",
            "first_name": "Quiz",
            "last_name": "Tester"
        })
        
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        token = signup_response.json()["token"]
        
        # Get a course to enroll in
        courses = requests.get(f"{BASE_URL}/api/courses").json()
        if len(courses) == 0:
            pytest.skip("No courses available")
        
        course = courses[0]
        
        # Enroll in course
        enroll_response = requests.post(
            f"{BASE_URL}/api/courses/enroll",
            json={"course_id": course["id"]},
            headers=TestSetup.get_auth_header(token)
        )
        
        if enroll_response.status_code != 200:
            pytest.skip(f"Could not enroll: {enroll_response.text}")
        
        tests = course.get("tests", [])
        if len(tests) == 0:
            pytest.skip("Course has no quiz")
        
        # Build wrong answers to fail
        wrong_answers = {}
        for test in tests:
            # Pick wrong answer
            wrong_answers[test["id"]] = (test["correct_answer"] + 1) % len(test["options"])
        
        # Attempt 1
        response1 = requests.post(
            f"{BASE_URL}/api/progress/quiz/submit",
            json={"course_id": course["id"], "answers": wrong_answers},
            headers=TestSetup.get_auth_header(token)
        )
        assert response1.status_code == 200
        result1 = response1.json()
        assert result1["attempts_remaining"] == 1, f"Expected 1 attempt remaining, got {result1['attempts_remaining']}"
        print(f"✓ Attempt 1: score={result1['score']}%, attempts_remaining={result1['attempts_remaining']}")
        
        # Attempt 2
        response2 = requests.post(
            f"{BASE_URL}/api/progress/quiz/submit",
            json={"course_id": course["id"], "answers": wrong_answers},
            headers=TestSetup.get_auth_header(token)
        )
        assert response2.status_code == 200
        result2 = response2.json()
        assert result2["attempts_remaining"] == 0, f"Expected 0 attempts remaining, got {result2['attempts_remaining']}"
        print(f"✓ Attempt 2: score={result2['score']}%, attempts_remaining={result2['attempts_remaining']}")
        
        # Attempt 3 should fail
        response3 = requests.post(
            f"{BASE_URL}/api/progress/quiz/submit",
            json={"course_id": course["id"], "answers": wrong_answers},
            headers=TestSetup.get_auth_header(token)
        )
        assert response3.status_code == 400, f"Expected 400 for 3rd attempt, got {response3.status_code}"
        assert "attempts" in response3.text.lower() or "maximum" in response3.text.lower()
        print("✓ 3rd attempt correctly blocked - max 2 attempts enforced")


class TestFileUpload:
    """Test file upload endpoints for trainers"""
    
    def test_video_upload_requires_auth(self):
        """Test that video upload requires trainer/admin auth"""
        # Try without auth
        response = requests.post(f"{BASE_URL}/api/upload/video")
        assert response.status_code == 401 or response.status_code == 422
        print("✓ Video upload requires authentication")
    
    def test_document_upload_requires_auth(self):
        """Test that document upload requires trainer/admin auth"""
        response = requests.post(f"{BASE_URL}/api/upload/document")
        assert response.status_code == 401 or response.status_code == 422
        print("✓ Document upload requires authentication")
    
    def test_learner_cannot_upload(self):
        """Test that learner cannot upload files"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        # Create a simple test file
        files = {'file': ('test.pdf', b'test content', 'application/pdf')}
        response = requests.post(
            f"{BASE_URL}/api/upload/document",
            files=files,
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Learner correctly denied file upload")


class TestAssignments:
    """Test assignment creation and submission"""
    
    def test_get_course_assignments(self):
        """Test getting assignments for a course"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        # Get enrolled courses
        my_courses = requests.get(
            f"{BASE_URL}/api/my-courses",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(my_courses) == 0:
            pytest.skip("Student not enrolled in any courses")
        
        course_id = my_courses[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/courses/{course_id}/assignments",
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 200
        assignments = response.json()
        print(f"✓ Retrieved {len(assignments)} assignments for course")
    
    def test_trainer_create_assignment(self):
        """Test trainer can create assignment"""
        token = TestSetup.login(TRAINER_EMAIL, TRAINER_PASSWORD)
        assert token, "Failed to get trainer token"
        
        # Get trainer's courses
        courses = requests.get(
            f"{BASE_URL}/api/trainer/courses",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(courses) == 0:
            pytest.skip("Trainer has no courses")
        
        course_id = courses[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/assignments",
            json={
                "course_id": course_id,
                "title": f"TEST_Assignment_{uuid.uuid4().hex[:8]}",
                "description": "Test assignment for automated testing",
                "instructions": "Complete the assignment and submit",
                "max_score": 100,
                "is_required": False
            },
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 200, f"Failed to create assignment: {response.text}"
        assignment = response.json()
        assert "id" in assignment
        print(f"✓ Trainer created assignment: {assignment['title']}")
        return assignment
    
    def test_learner_cannot_create_assignment(self):
        """Test that learner cannot create assignment"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        response = requests.post(
            f"{BASE_URL}/api/assignments",
            json={
                "course_id": "some-course-id",
                "title": "Unauthorized Assignment",
                "description": "Should not be created",
                "instructions": "N/A"
            },
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Learner correctly denied assignment creation")


class TestCertificates:
    """Test certificate generation and verification"""
    
    def test_get_my_certificates(self):
        """Test getting user's certificates"""
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        assert token, "Failed to get student token"
        
        response = requests.get(
            f"{BASE_URL}/api/certificates",
            headers=TestSetup.get_auth_header(token)
        )
        assert response.status_code == 200
        certificates = response.json()
        print(f"✓ Student has {len(certificates)} certificates")
        return certificates
    
    def test_verify_certificate_invalid(self):
        """Test verifying an invalid certificate number"""
        response = requests.get(f"{BASE_URL}/api/certificates/verify/INVALID-CERT-123")
        assert response.status_code == 200
        result = response.json()
        assert result["valid"] == False
        print("✓ Invalid certificate correctly returns valid=false")
    
    def test_certificate_verification_endpoint(self):
        """Test certificate verification endpoint structure"""
        # First check if student has any certificates
        token = TestSetup.login(STUDENT_EMAIL, STUDENT_PASSWORD)
        certs = requests.get(
            f"{BASE_URL}/api/certificates",
            headers=TestSetup.get_auth_header(token)
        ).json()
        
        if len(certs) > 0:
            cert_number = certs[0]["certificate_number"]
            response = requests.get(f"{BASE_URL}/api/certificates/verify/{cert_number}")
            assert response.status_code == 200
            result = response.json()
            assert result["valid"] == True
            assert "user_name" in result
            assert "course_title" in result
            print(f"✓ Certificate {cert_number} verified successfully")
        else:
            print("✓ No certificates to verify (student hasn't completed any courses)")


class TestCertificateGeneration:
    """Test full flow: complete modules + pass quiz = certificate"""
    
    def test_full_learning_flow(self):
        """Test complete learning flow: enroll -> complete modules -> pass quiz -> get certificate"""
        # Create a fresh test user
        unique_email = f"test_fullflow_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpass123",
            "first_name": "Full",
            "last_name": "Flow"
        })
        
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        token = signup_response.json()["token"]
        headers = TestSetup.get_auth_header(token)
        
        # Get a course with modules and quiz
        courses = requests.get(f"{BASE_URL}/api/courses").json()
        course = next((c for c in courses if len(c.get("tests", [])) > 0 and len(c.get("modules", [])) > 0), None)
        
        if not course:
            pytest.skip("No course with modules and quiz found")
        
        print(f"Testing with course: {course['title']}")
        
        # Enroll
        enroll_response = requests.post(
            f"{BASE_URL}/api/courses/enroll",
            json={"course_id": course["id"]},
            headers=headers
        )
        assert enroll_response.status_code == 200, f"Enrollment failed: {enroll_response.text}"
        print("✓ Enrolled in course")
        
        # Complete all modules
        for module in course["modules"]:
            complete_response = requests.post(
                f"{BASE_URL}/api/progress/module/complete",
                json={
                    "course_id": course["id"],
                    "module_id": module["id"],
                    "time_spent_minutes": 30
                },
                headers=headers
            )
            assert complete_response.status_code == 200, f"Module completion failed: {complete_response.text}"
        print(f"✓ Completed all {len(course['modules'])} modules")
        
        # Pass the quiz (answer all correctly)
        correct_answers = {}
        for test in course["tests"]:
            correct_answers[test["id"]] = test["correct_answer"]
        
        quiz_response = requests.post(
            f"{BASE_URL}/api/progress/quiz/submit",
            json={
                "course_id": course["id"],
                "answers": correct_answers
            },
            headers=headers
        )
        assert quiz_response.status_code == 200, f"Quiz submission failed: {quiz_response.text}"
        quiz_result = quiz_response.json()
        assert quiz_result["passed"] == True, f"Quiz not passed: score={quiz_result['score']}%"
        print(f"✓ Quiz passed with score: {quiz_result['score']}%")
        
        # Check if certificate was issued
        if quiz_result.get("certificate_issued"):
            cert = quiz_result.get("certificate")
            assert cert is not None
            assert "certificate_number" in cert
            print(f"✓ Certificate issued: {cert['certificate_number']}")
            
            # Verify the certificate
            verify_response = requests.get(f"{BASE_URL}/api/certificates/verify/{cert['certificate_number']}")
            assert verify_response.status_code == 200
            verify_result = verify_response.json()
            assert verify_result["valid"] == True
            print(f"✓ Certificate verified successfully")
        else:
            # Certificate might not be issued if there are required assignments
            print("✓ Quiz passed but certificate not issued (may require assignments)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
