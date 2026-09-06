# sessions/services/relay.py
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from cryptography.hazmat.primitives.asymmetric import rsa, ed25519
from cryptography.hazmat.primitives import serialization
from ..models import RelayPort


class RelayService:
    """Manage SSH relay ports and cryptographic session key generation"""
    
    @classmethod
    def get_port_range(cls):
        """Get configurable port range from settings or defaults"""
        start = getattr(settings, 'RELAY_PORT_START', 40000)
        end = getattr(settings, 'RELAY_PORT_END', 50000)
        return start, end

    @classmethod
    def get_relay_host(cls):
        """Get the public relay host IP or hostname"""
        return getattr(settings, 'RELAY_HOST', '127.0.0.1')
    
    @classmethod
    @transaction.atomic
    def allocate_port(cls, session_id):
        """Allocate a free relay port for a session with row-level locking"""
        start_port, end_port = cls.get_port_range()
        
        # Find free port with row-level locking
        port = RelayPort.objects.select_for_update().filter(
            status='free',
            port__gte=start_port,
            port__lte=end_port
        ).order_by('port').first()
        
        if not port:
            # Automatically allocate and create the next unused port in range on-demand
            used_ports = set(RelayPort.objects.filter(port__gte=start_port, port__lte=end_port).values_list('port', flat=True))
            for p_num in range(start_port, end_port + 1):
                if p_num not in used_ports:
                    port = RelayPort.objects.create(
                        port=p_num,
                        status='free'
                    )
                    break
            
            if not port:
                raise ValueError(f"No free relay ports available in range {start_port}-{end_port}")
        
        # Lease the port
        port.lease(session_id)
        
        return {
            'port': port.port,
            'port_id': port.id
        }
    
    @classmethod
    def release_port(cls, port_id):
        """Release a leased port"""
        try:
            port = RelayPort.objects.get(id=port_id)
            port.release()
            return True
        except RelayPort.DoesNotExist:
            return False
    
    @classmethod
    def get_free_port_count(cls):
        """Get number of free ports"""
        start_port, end_port = cls.get_port_range()
        return RelayPort.objects.filter(
            status='free',
            port__gte=start_port,
            port__lte=end_port
        ).count()
    
    @classmethod
    def generate_ssh_keypair(cls, key_type='rsa', key_size=2048):
        """
        Generate a cryptographically genuine SSH keypair.
        Returns:
            tuple: (private_key_pem_string, public_key_openssh_string)
        """
        if key_type == 'ed25519':
            private_key = ed25519.Ed25519PrivateKey.generate()
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.OpenSSH,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')
            public_openssh = private_key.public_key().public_bytes(
                encoding=serialization.Encoding.OpenSSH,
                format=serialization.PublicFormat.OpenSSH
            ).decode('utf-8')
        else:
            # RSA (default for maximum OpenSSH compatibility)
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size
            )
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')
            public_openssh = private_key.public_key().public_bytes(
                encoding=serialization.Encoding.OpenSSH,
                format=serialization.PublicFormat.OpenSSH
            ).decode('utf-8')
            
        return private_pem, public_openssh

    @classmethod
    def generate_ssh_key(cls, session_id):
        """
        Generate temporary real RSA private key for the session tunnel authentication.
        """
        private_key, _ = cls.generate_ssh_keypair(key_type='rsa', key_size=2048)
        return private_key