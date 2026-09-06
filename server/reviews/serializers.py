from rest_framework import serializers
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from .models import Review
from sessions.models import Session


class ReviewDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for viewing reviews"""
    renter_id = serializers.UUIDField(source='renter.id', read_only=True)
    renter_name = serializers.SerializerMethodField()
    host_id = serializers.UUIDField(source='host.id', read_only=True)
    host_name = serializers.CharField(source='host.user.email', read_only=True)
    gpu_id = serializers.UUIDField(source='gpu.id', read_only=True)
    gpu_name = serializers.CharField(source='gpu.gpu_name', read_only=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True)

    class Meta:
        model = Review
        fields = (
            'id',
            'session_id',
            'renter_id',
            'renter_name',
            'host_id',
            'host_name',
            'gpu_id',
            'gpu_name',
            'rating',
            'communication_rating',
            'reliability_rating',
            'gpu_performance_rating',
            'comment',
            'is_verified',
            'host_response',
            'host_responded_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    @extend_schema_field(serializers.CharField())
    def get_renter_name(self, obj):
        """Display renter full name or masked email for privacy"""
        if obj.renter.first_name or obj.renter.last_name:
            return f"{obj.renter.first_name} {obj.renter.last_name}".strip()
        email = obj.renter.email
        if '@' in email:
            name_part, domain = email.split('@', 1)
            masked = name_part[:2] + '***' if len(name_part) > 2 else name_part + '***'
            return f"{masked}@{domain}"
        return email


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new review after session completion"""
    session_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Review
        fields = (
            'id',
            'session_id',
            'rating',
            'communication_rating',
            'reliability_rating',
            'gpu_performance_rating',
            'comment',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_communication_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Communication rating must be between 1 and 5.")
        return value

    def validate_reliability_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Reliability rating must be between 1 and 5.")
        return value

    def validate_gpu_performance_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("GPU performance rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None

        if not user or not user.is_authenticated:
            raise serializers.ValidationError("You must be logged in to submit a review.")

        session_id = attrs.get('session_id')
        try:
            session = Session.objects.select_related('host', 'gpu', 'renter').get(id=session_id)
        except Session.DoesNotExist:
            raise serializers.ValidationError({"session_id": "Session not found."})

        # Check renter ownership
        if session.renter_id != user.id:
            raise serializers.ValidationError({"session_id": "You can only review sessions that you rented."})

        # Check session completion status
        if session.status not in ['completed', 'terminated']:
            raise serializers.ValidationError({
                "session_id": f"Reviews can only be submitted for completed or finished sessions. Current status is '{session.status}'."
            })

        # Check if review already exists
        if hasattr(session, 'review'):
            raise serializers.ValidationError({"session_id": "A review has already been submitted for this session."})

        attrs['session'] = session
        attrs['renter'] = user
        attrs['host'] = session.host
        attrs['gpu'] = session.gpu
        attrs['is_verified'] = True

        return attrs

    def create(self, validated_data):
        validated_data.pop('session_id', None)
        return super().create(validated_data)


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an existing review by the author"""

    class Meta:
        model = Review
        fields = (
            'rating',
            'communication_rating',
            'reliability_rating',
            'gpu_performance_rating',
            'comment',
        )

    def validate_rating(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_communication_rating(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Communication rating must be between 1 and 5.")
        return value

    def validate_reliability_rating(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Reliability rating must be between 1 and 5.")
        return value

    def validate_gpu_performance_rating(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("GPU performance rating must be between 1 and 5.")
        return value


class ReviewHostResponseSerializer(serializers.ModelSerializer):
    """Serializer for hosts responding to a review"""

    class Meta:
        model = Review
        fields = ('host_response',)
        extra_kwargs = {
            'host_response': {'required': True, 'allow_blank': False}
        }

    def update(self, instance, validated_data):
        instance.host_response = validated_data.get('host_response')
        instance.host_responded_at = timezone.now()
        instance.save()
        return instance


class RatingStarBucketSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class RatingDistributionSerializer(serializers.Serializer):
    five_star = RatingStarBucketSerializer(source='5_star')
    four_star = RatingStarBucketSerializer(source='4_star')
    three_star = RatingStarBucketSerializer(source='3_star')
    two_star = RatingStarBucketSerializer(source='2_star')
    one_star = RatingStarBucketSerializer(source='1_star')


class ReviewSummarySerializer(serializers.Serializer):
    average_rating = serializers.FloatField()
    average_communication = serializers.FloatField()
    average_reliability = serializers.FloatField()
    average_gpu_performance = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    verified_reviews_count = serializers.IntegerField()
    rating_distribution = RatingDistributionSerializer()
