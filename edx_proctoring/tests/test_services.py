# pylint: disable=unused-argument

"""
Test for the xBlock service
"""

from __future__ import absolute_import

import types
import unittest

from edx_proctoring.services import (
    ProctoringService
)
from edx_proctoring.exceptions import UserNotFoundException
from edx_proctoring import api as edx_proctoring_api


class MockInstructorService(object):
    """
    Simple mock of the Instructor Service
    """
    def __init__(self, is_user_course_staff=True):
        """
        Initializer
        """
        self.is_user_course_staff = is_user_course_staff

    # pylint: disable=unused-argument
    def delete_student_attempt(self, student_identifier, course_id, content_id, requesting_user):
        """
        Mock implementation
        """
        # Ensure that this method was called with a real user object
        if not hasattr(requesting_user, 'id'):
            raise UserNotFoundException
        return True

    def is_course_staff(self, user, course_id):
        """
        Mocked implementation of is_course_staff
        """
        return self.is_user_course_staff

    def send_support_notification(self, course_id, exam_name, student_username, review_status):
        """
        Mocked implementation of send_support_notification
        """
        pass


class TestProctoringService(unittest.TestCase):
    """
    Tests for ProctoringService
    """
    def test_basic(self):
        """
        See if the ProctoringService exposes the expected methods
        """

        service = ProctoringService()

        for attr_name in dir(edx_proctoring_api):
            attr = getattr(edx_proctoring_api, attr_name, None)
            if isinstance(attr, types.FunctionType) and not attr_name.startswith('_'):
                self.assertTrue(hasattr(service, attr_name))

    def test_singleton(self):
        """
        Test to make sure the ProctoringService is a singleton.
        """
        service1 = ProctoringService()
        service2 = ProctoringService()
        self.assertIs(service1, service2)


class MockGrade(object):
    """Fake PersistentSubsectionGrade instance."""
    def __init__(self, earned_all=0.0, earned_graded=0.0):
        self.earned_all = earned_all
        self.earned_graded = earned_graded


class MockGradeOverride(object):
    """Fake PersistentSubsectionGradeOverride instance."""
    def __init__(self, earned_all=0.0, earned_graded=0.0):
        self.earned_all_override = earned_all
        self.earned_graded_override = earned_graded


class MockGeneratedCertificate(object):
    """Fake GeneratedCertificate instance."""
    def __init__(self):
        self.verify_uuid = 'test_verify_uuid'
        self.download_uuid = 'test_download_uuid'
        self.download_url = 'test_download_url'
        self.grade = 1.0
        self.status = 'downloadable'

    def mock_invalidate(self):
        """
        Invalidate Generated Certificate by  marking it 'unavailable'.
        """
        self.verify_uuid = ''
        self.download_uuid = ''
        self.download_url = ''
        self.grade = ''
        self.status = 'unavailable'


class MockGradesService(object):
    """
    Simple mock of the Grades Service
    """
    def __init__(self, rejected_exam_overrides_grade=True):
        """Initialize empty data stores for grades and overrides (just dicts)"""
        self.grades = {}
        self.overrides = {}
        self.rejected_exam_overrides_grade = rejected_exam_overrides_grade

    def init_grade(self, user_id, course_key_or_id, usage_key_or_id, earned_all, earned_graded):
        """Initialize a grade in MockGradesService for testing. Actual GradesService does not have this method."""
        self.grades[str(user_id) + str(course_key_or_id) + str(usage_key_or_id)] = MockGrade(
            earned_all=earned_all,
            earned_graded=earned_graded
        )

    def get_subsection_grade(self, user_id, course_key_or_id, usage_key_or_id):
        """Returns entered grade for key (user_id + course_key + subsection) or None"""
        key = str(user_id) + str(course_key_or_id) + str(usage_key_or_id)
        if key in self.overrides:
            # pretend override was applied
            return MockGrade(
                earned_all=self.overrides[key].earned_all_override,
                earned_graded=self.overrides[key].earned_graded_override
            )
        return self.grades.get(str(user_id) + str(course_key_or_id) + str(usage_key_or_id))

    def get_subsection_grade_override(self, user_id, course_key_or_id, usage_key_or_id):
        """Returns entered grade override for key (user_id + course_key + subsection) or None"""
        return self.overrides.get(str(user_id) + str(course_key_or_id) + str(usage_key_or_id))

    def override_subsection_grade(self, user_id, course_key_or_id, usage_key_or_id, earned_all=None,
                                  earned_graded=None):
        """Sets grade override earned points for key (user_id + course_key + subsection)"""
        key = str(user_id) + str(course_key_or_id) + str(usage_key_or_id)
        self.overrides[key] = MockGradeOverride(
            earned_all=earned_all,
            earned_graded=earned_graded
        )

    def undo_override_subsection_grade(self, user_id, course_key_or_id, usage_key_or_id):
        """Deletes grade override for key (user_id + course_key + subsection)"""
        key = str(user_id) + str(course_key_or_id) + str(usage_key_or_id)
        if key in self.overrides:
            del self.overrides[key]

    def should_override_grade_on_rejected_exam(self, course_key):
        """Mock will always return instance variable: rejected_exam_overrides_grade"""
        return self.rejected_exam_overrides_grade


class MockCertificateService(object):
    """
    mock Certificate Service
    """
    def __init__(self):
        """
        Initialize empty data stores for generated certificate
        """
        self.generated_certificate = {}

    def invalidate_certificate(self, user_id, course_key_or_id):
        """
        Get the generated certificate for key (user_id + course_key) and invalidate certificate
        whose grade dropped below passing threshold due to suspicious proctored exam
        """
        key = str(user_id) + str(course_key_or_id)
        self.generated_certificate[key] = MockGeneratedCertificate()
        self.generated_certificate[key].mock_invalidate()

    def get_invalidated_certificate(self, user_id, course_key_or_id):
        """
        Returns invalidated certificate for key (user_id + course_key)
        """
        return self.generated_certificate.get(str(user_id) + str(course_key_or_id))
