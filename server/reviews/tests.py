from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from users.models import User, HostProfile
from gpus.models import GPU
from sessions.models import Session
from reviews.models import Review
from gpus.serializers import GPUSerializer


class ReviewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Create Host User and Profile
        self.host_user = User.objects.create_user(
            email="host@example.com",
            password="hostpassword123",
            first_name="Alice",
            last_name="Host",
            role="host"
        )
        self.host_profile = self.host_user.host_profile
        self.host_profile.status = "online"
        self.host_profile.save()

        # 2. Create Another Host
        self.other_host_user = User.objects.create_user(
            email="otherhost@example.com",
            password="hostpassword123",
            first_name="Bob",
            last_name="OtherHost",
            role="host"
        )
        self.other_host_profile = self.other_host_user.host_profile

        # 3. Create Renters
        self.renter_user = User.objects.create_user(
            email="renter@example.com",
            password="renterpassword123",
            first_name="Charlie",
            last_name="Renter",
            role="renter"
        )
        self.other_renter_user = User.objects.create_user(
            email="otherrenter@example.com",
            password="renterpassword123",
            first_name="David",
            last_name="OtherRenter",
            role="renter"
        )

        # 4. Create GPU
        self.gpu = GPU.objects.create(
            host=self.host_profile,
            gpu_name="NVIDIA RTX 4090",
            vram_total="24576 MiB",
            vram_gb=24,
            price_per_hour=2.50,
            is_available=True,
            location="Dallas, TX"
        )

        # 5. Create Sessions
        self.completed_session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='completed',
            total_amount=10.00
        )

        self.terminated_session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='terminated',
            total_amount=5.00
        )

        self.active_session = Session.objects.create(
            gpu=self.gpu,
            host=self.host_profile,
            renter=self.renter_user,
            status='active',
            total_amount=2.50
        )

    def test_create_review_success(self):
        """Renter can create a review for a completed session"""
        self.client.force_authenticate(user=self.renter_user)
        payload = {
            "session_id": str(self.completed_session.id),
            "rating": 5,
            "communication_rating": 5,
            "reliability_rating": 4,
            "gpu_performance_rating": 5,
            "comment": "Super fast GPU and very responsive host!"
        }
        response = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['communication_rating'], 5)
        self.assertEqual(response.data['reliability_rating'], 4)
        self.assertEqual(response.data['gpu_performance_rating'], 5)
        self.assertEqual(response.data['comment'], "Super fast GPU and very responsive host!")
        self.assertTrue(response.data['is_verified'])
        self.assertEqual(response.data['host_id'], str(self.host_profile.id))
        self.assertEqual(response.data['gpu_id'], str(self.gpu.id))

        # Check host received notification
        self.assertTrue(self.host_user.notifications.filter(type='review_received').exists())

    def test_create_review_for_terminated_session(self):
        """Renter can create a review for a terminated session"""
        self.client.force_authenticate(user=self.renter_user)
        payload = {
            "session_id": str(self.terminated_session.id),
            "rating": 4,
            "communication_rating": 4,
            "reliability_rating": 3,
            "gpu_performance_rating": 4,
            "comment": "Good session overall."
        }
        response = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_review_active_session(self):
        """Renter cannot review an active/non-completed session"""
        self.client.force_authenticate(user=self.renter_user)
        payload = {
            "session_id": str(self.active_session.id),
            "rating": 5,
            "comment": "Session still running"
        }
        response = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("session_id", response.data)

    def test_cannot_review_others_session(self):
        """A user cannot review a session rented by someone else"""
        self.client.force_authenticate(user=self.other_renter_user)
        payload = {
            "session_id": str(self.completed_session.id),
            "rating": 5,
            "comment": "Trying to review someone else's session"
        }
        response = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("session_id", response.data)

    def test_cannot_review_same_session_twice(self):
        """Duplicate reviews for the same session are rejected"""
        self.client.force_authenticate(user=self.renter_user)
        payload = {
            "session_id": str(self.completed_session.id),
            "rating": 5,
            "comment": "First review"
        }
        response1 = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        response2 = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("session_id", response2.data)

    def test_invalid_rating_values(self):
        """Ratings must be between 1 and 5"""
        self.client.force_authenticate(user=self.renter_user)
        payload = {
            "session_id": str(self.completed_session.id),
            "rating": 6,
            "communication_rating": 0,
        }
        response = self.client.post(reverse('reviews:review-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_and_delete_review(self):
        """Author can update and delete their own review"""
        review = Review.objects.create(
            session=self.completed_session,
            renter=self.renter_user,
            host=self.host_profile,
            gpu=self.gpu,
            rating=4,
            comment="Initial comment"
        )

        # Non-author tries to update
        self.client.force_authenticate(user=self.other_renter_user)
        update_url = reverse('reviews:review-detail', kwargs={'review_id': review.id})
        response = self.client.patch(update_url, {"rating": 1, "comment": "Hacked"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Author updates
        self.client.force_authenticate(user=self.renter_user)
        response = self.client.patch(update_url, {"rating": 5, "comment": "Updated comment"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], "Updated comment")

        # Author deletes
        del_response = self.client.delete(update_url)
        self.assertEqual(del_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Review.objects.filter(id=review.id).exists())

    def test_host_response(self):
        """Host can reply to a review left on their session"""
        review = Review.objects.create(
            session=self.completed_session,
            renter=self.renter_user,
            host=self.host_profile,
            gpu=self.gpu,
            rating=5,
            comment="Excellent GPU!"
        )

        respond_url = reverse('reviews:review-respond', kwargs={'review_id': review.id})

        # Other host cannot respond
        self.client.force_authenticate(user=self.other_host_user)
        response = self.client.post(respond_url, {"host_response": "Thank you!"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Correct host responds
        self.client.force_authenticate(user=self.host_user)
        response = self.client.post(respond_url, {"host_response": "Thank you for renting with us!"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['host_response'], "Thank you for renting with us!")
        self.assertIsNotNone(response.data['host_responded_at'])

        # Check renter received notification
        self.assertTrue(self.renter_user.notifications.filter(type='review_response').exists())

    def test_host_and_gpu_summary_distribution(self):
        """Summary endpoints accurately return average ratings and star distribution"""
        # Session 1: 5-star
        Review.objects.create(
            session=self.completed_session,
            renter=self.renter_user,
            host=self.host_profile,
            gpu=self.gpu,
            rating=5,
            communication_rating=5,
            reliability_rating=5,
            gpu_performance_rating=5,
            comment="Awesome 1"
        )

        # Session 2: 3-star
        Review.objects.create(
            session=self.terminated_session,
            renter=self.renter_user,
            host=self.host_profile,
            gpu=self.gpu,
            rating=3,
            communication_rating=4,
            reliability_rating=3,
            gpu_performance_rating=3,
            comment="Average"
        )

        # Host Summary
        host_summary_url = reverse('reviews:host-review-summary', kwargs={'host_id': self.host_profile.id})
        response = self.client.get(host_summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['total_reviews'], 2)
        self.assertEqual(data['average_rating'], 4.0)  # (5 + 3)/2
        self.assertEqual(data['average_communication'], 4.5)  # (5 + 4)/2
        self.assertEqual(data['average_reliability'], 4.0)  # (5 + 3)/2
        self.assertEqual(data['average_gpu_performance'], 4.0)  # (5 + 3)/2
        self.assertEqual(data['rating_distribution']['5_star']['count'], 1)
        self.assertEqual(data['rating_distribution']['5_star']['percentage'], 50.0)
        self.assertEqual(data['rating_distribution']['3_star']['count'], 1)
        self.assertEqual(data['rating_distribution']['3_star']['percentage'], 50.0)

        # GPU Summary
        gpu_summary_url = reverse('reviews:gpu-review-summary', kwargs={'gpu_id': self.gpu.id})
        gpu_resp = self.client.get(gpu_summary_url)
        self.assertEqual(gpu_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(gpu_resp.data['total_reviews'], 2)
        self.assertEqual(gpu_resp.data['average_rating'], 4.0)

        # GPUSerializer check
        gpu_serializer = GPUSerializer(instance=self.gpu)
        self.assertEqual(gpu_serializer.data['average_rating'], 4.0)

    def test_can_review_endpoint(self):
        """can-review endpoint provides correct eligibility check"""
        self.client.force_authenticate(user=self.renter_user)

        # Completed session without review -> can_review True
        url = reverse('reviews:can-review-session', kwargs={'session_id': self.completed_session.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['can_review'])

        # Active session -> can_review False
        url_active = reverse('reviews:can-review-session', kwargs={'session_id': self.active_session.id})
        resp_active = self.client.get(url_active)
        self.assertEqual(resp_active.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_active.data['can_review'])

        # After review submitted -> can_review False
        Review.objects.create(
            session=self.completed_session,
            renter=self.renter_user,
            host=self.host_profile,
            gpu=self.gpu,
            rating=5
        )
        resp_after = self.client.get(url)
        self.assertEqual(resp_after.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_after.data['can_review'])

