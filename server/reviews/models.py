from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg, Count, Q
import uuid


class ReviewQuerySet(models.QuerySet):
    """Custom queryset with summary statistics helpers"""

    def summary_stats(self):
        """Calculate aggregate rating statistics for the queryset"""
        aggregates = self.aggregate(
            avg_rating=Avg('rating'),
            avg_communication=Avg('communication_rating'),
            avg_reliability=Avg('reliability_rating'),
            avg_gpu_performance=Avg('gpu_performance_rating'),
            total_count=Count('id'),
            verified_count=Count('id', filter=Q(is_verified=True)),
            count_5_star=Count('id', filter=Q(rating=5)),
            count_4_star=Count('id', filter=Q(rating=4)),
            count_3_star=Count('id', filter=Q(rating=3)),
            count_2_star=Count('id', filter=Q(rating=2)),
            count_1_star=Count('id', filter=Q(rating=1)),
        )

        total = aggregates['total_count'] or 0

        def get_pct(count):
            return round((count / total) * 100, 1) if total > 0 else 0.0

        return {
            'average_rating': round(aggregates['avg_rating'], 2) if aggregates['avg_rating'] is not None else 0.0,
            'average_communication': round(aggregates['avg_communication'], 2) if aggregates['avg_communication'] is not None else 0.0,
            'average_reliability': round(aggregates['avg_reliability'], 2) if aggregates['avg_reliability'] is not None else 0.0,
            'average_gpu_performance': round(aggregates['avg_gpu_performance'], 2) if aggregates['avg_gpu_performance'] is not None else 0.0,
            'total_reviews': total,
            'verified_reviews_count': aggregates['verified_count'] or 0,
            'rating_distribution': {
                '5_star': {
                    'count': aggregates['count_5_star'] or 0,
                    'percentage': get_pct(aggregates['count_5_star'] or 0),
                },
                '4_star': {
                    'count': aggregates['count_4_star'] or 0,
                    'percentage': get_pct(aggregates['count_4_star'] or 0),
                },
                '3_star': {
                    'count': aggregates['count_3_star'] or 0,
                    'percentage': get_pct(aggregates['count_3_star'] or 0),
                },
                '2_star': {
                    'count': aggregates['count_2_star'] or 0,
                    'percentage': get_pct(aggregates['count_2_star'] or 0),
                },
                '1_star': {
                    'count': aggregates['count_1_star'] or 0,
                    'percentage': get_pct(aggregates['count_1_star'] or 0),
                },
            }
        }


class Review(models.Model):
    """
    Review left by a renter for a completed/terminated GPU rental session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    session = models.OneToOneField(
        'gpu_sessions.Session',
        on_delete=models.CASCADE,
        related_name='review',
        help_text="The completed rental session associated with this review"
    )
    renter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        help_text="Renter who authored this review"
    )
    host = models.ForeignKey(
        'users.HostProfile',
        on_delete=models.CASCADE,
        related_name='reviews_received',
        help_text="Host profile being reviewed"
    )
    gpu = models.ForeignKey(
        'gpus.GPU',
        on_delete=models.CASCADE,
        related_name='reviews',
        help_text="GPU used during the session"
    )

    # Rating Categories (1 to 5 stars)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Overall rating (1-5 stars)"
    )
    communication_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5,
        help_text="How responsive was the host? (1-5 stars)"
    )
    reliability_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5,
        help_text="Did the host stay online and maintain stable service? (1-5 stars)"
    )
    gpu_performance_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5,
        help_text="Was the GPU fast and performing as expected? (1-5 stars)"
    )

    # Text Review
    comment = models.TextField(
        blank=True,
        default='',
        help_text="Detailed feedback from the renter"
    )

    # Verification flag
    is_verified = models.BooleanField(
        default=True,
        help_text="Indicates review is from a verified completed rental session"
    )

    # Host Response
    host_response = models.TextField(
        blank=True,
        null=True,
        help_text="Optional response from the host"
    )
    host_responded_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when host responded"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ReviewQuerySet.as_manager()

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host', '-created_at']),
            models.Index(fields=['gpu', '-created_at']),
            models.Index(fields=['renter', '-created_at']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return f"Review {self.id}: {self.rating}★ by {self.renter.email} for Host {self.host.user.email}"

