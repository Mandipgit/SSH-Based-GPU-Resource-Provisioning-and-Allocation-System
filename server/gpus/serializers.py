from rest_framework import serializers
from .models import GPU


class GPUSerializer(serializers.ModelSerializer):
    """Serializer for Gpu Model"""
    
    host_name = serializers.CharField(source='host.user.email', read_only = True)
    host_uptime = serializers.FloatField(source='host.uptime_percentage', read_only = True)
    host_reliability = serializers.IntegerField(source='host.reliability_score',read_only= True)
    is_rentable = serializers.BooleanField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = GPU
        fields = (
            'id', 'host', 'host_name', 'host_uptime', 'host_reliability',
            'gpu_name', 'vram_total', 'vram_gb', 'cuda_cores',
            'memory_bandwidth', 'compute_capability',
            'driver_version', 'cuda_version',
            'price_per_hour', 'is_available', 'is_rentable',
            'location', 'total_rental_hours', 'total_earnings',
            'total_sessions', 'average_rating',
            'created_at', 'updated_at'  
        )
        
        read_only_fields = (
            'id', 'host', 'total_rental_hours', 'total_earnings',
            'total_sessions', 'created_at', 'updated_at'
        )
        
    def get_average_rating(self, obj):
        """Calculate average rating from reviews"""
        from reviews.models import Review
        from django.db.models import Avg
        result = Review.objects.filter(gpu=obj).aggregate(avg_rating=Avg('rating'))
        avg = result.get('avg_rating')
        return round(avg, 2) if avg is not None else None
    
    def validate_price_per_hour(self, value):
        """Validate price per hour"""
        
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        
        return value
    
    def validate_vram_gb(self, value):
        """Validate VRAM"""
        if value <= 0:
            raise serializers.ValidationError("VRAM must be greater than 0")
        if value > 200:
            raise serializers.ValidationError("VRAM cannot exceed 200GB")
        return value



class GPUCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a GPU"""
    
    class Meta:
        model = GPU
        fields = (
            'gpu_name', 'vram_total', 'vram_gb', 'cuda_cores',
            'memory_bandwidth', 'compute_capability',
            'driver_version', 'cuda_version',
            'price_per_hour', 'location'
            
        )
        
    def validate_price_per_hour(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        
        return value
        
        
class GPUUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a GPU"""
    class Meta:
        model = GPU
        fields = (
            'gpu_name', 'vram_total', 'vram_gb', 'cuda_cores',
            'memory_bandwidth', 'compute_capability',
            'driver_version', 'cuda_version',
            'price_per_hour', 'location'   
        )
        
        extra_kwargs = {
            'gpu_name': {'required': False},
            'vram_total': {'required': False},
            'vram_gb': {'required': False},
            'price_per_hour': {'required': False},
        }


class GPUAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for toggling GPU availability"""
    
    class Meta:
        model = GPU
        fields = ('is_available',)
        
    def update(self, instance, validated_data):
        is_available = validated_data.get('is_available')
            
        if not is_available and instance.current_session_id:
            raise serializers.ValidationError(
                    "Cannot set unavailable while GPU is rented"
                )
                
        instance.is_available = is_available
        instance.save()
                
        return instance
        
        
class GPUPriceSerializer(serializers.ModelSerializer):
    """Serializer for updating GPU Price"""
    
    class Meta:
        model = GPU
        fields = ('price_per_hour',)
        
    def validate_price_per_hour(self,value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
        

class GPUStatsSerializer(serializers.ModelSerializer):
    """Serializer for GPU statistics"""
    class Meta:
        model = GPU
        fields = (
            'total_rental_hours', 'total_earnings',
            'total_sessions', 'is_available'
            
        )
        
        
class GPUMarketplaceStatsSerializer(serializers.Serializer):
    """Serializer for marketplace statistics"""
    
    total_gpus = serializers.IntegerField()
    available_gpus = serializers.IntegerField()
    total_hosts = serializers.IntegerField()
    avg_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_rental_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
            
