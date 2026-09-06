# sessions/services/relay.py
from pathlib import Path
import os
import subprocess

from django.db import transaction
from django.conf import settings
from cryptography.hazmat.primitives.asymmetric import rsa, ed25519
from cryptography.hazmat.primitives import serialization
from ..models import RelayPort


class RelayService:
    """Manage SSH relay ports and cryptographic session key generation"""

    LOCAL_HOSTS = {'localhost', '127.0.0.1', '0.0.0.0', '::1'}

    @classmethod
    def get_port_range(cls):
        start = getattr(settings, 'RELAY_PORT_START', 40000)
        end = getattr(settings, 'RELAY_PORT_END', 50000)
        return start, end

    @classmethod
    def get_relay_host(cls):
        return cls.get_public_host()

    @classmethod
    def get_public_host(cls):
        host = (
            getattr(settings, 'RELAY_PUBLIC_HOST', None)
            or getattr(settings, 'RELAY_HOST', None)
            or 'bore.pub'
        ).strip()
        if not host or host.lower() in cls.LOCAL_HOSTS:
            host = 'bore.pub'
        return host

    @classmethod
    def get_connect_host(cls):
        host = (
            getattr(settings, 'RELAY_CONNECT_HOST', None)
            or getattr(settings, 'RELAY_HOST', None)
            or cls.get_public_host()
        ).strip()
        return host or cls.get_public_host()

    @classmethod
    def get_ssh_user(cls):
        return getattr(settings, 'RELAY_SSH_USER', 'relay_user') or 'relay_user'

    @classmethod
    def get_ssh_port(cls) -> int:
        return int(getattr(settings, 'RELAY_SSH_PORT', 22) or 22)

    @classmethod
    def is_local_host(cls, host: str | None) -> bool:
        if not host:
            return True
        return host.strip().lower().split('%')[0] in cls.LOCAL_HOSTS

    @classmethod
    def get_public_port_map(cls) -> dict:
        raw = getattr(settings, 'RELAY_PUBLIC_PORT_MAP', '') or ''
        mapping = {}
        for part in raw.split(','):
            part = part.strip()
            if not part or ':' not in part:
                continue
            a, b = part.split(':', 1)
            try:
                mapping[int(a)] = int(b)
            except ValueError:
                continue
        return mapping

    @classmethod
    def get_public_port(cls, relay_port: int) -> int:
        return cls.get_public_port_map().get(int(relay_port), int(relay_port))

    @classmethod
    def format_ssh_command(cls, port, host=None, user=None) -> str:
        public_host = host if host and not cls.is_local_host(host) else cls.get_public_host()
        ssh_user = user or 'renter'
        public_port = cls.get_public_port(port)
        return f"ssh -p {public_port} {ssh_user}@{public_host}"

    @classmethod
    @transaction.atomic
    def allocate_port(cls, session_id):
        start_port, end_port = cls.get_port_range()
        port = RelayPort.objects.select_for_update().filter(
            status='free',
            port__gte=start_port,
            port__lte=end_port
        ).order_by('port').first()

        if not port:
            used_ports = set(RelayPort.objects.filter(port__gte=start_port, port__lte=end_port).values_list('port', flat=True))
            for p_num in range(start_port, end_port + 1):
                if p_num not in used_ports:
                    port = RelayPort.objects.create(port=p_num, status='free')
                    break
            if not port:
                raise ValueError(f"No free relay ports available in range {start_port}-{end_port}")

        port.lease(session_id)
        return {'port': port.port, 'port_id': port.id}

    @classmethod
    def release_port(cls, port_id):
        try:
            port = RelayPort.objects.get(id=port_id)
            port.release()
            return True
        except RelayPort.DoesNotExist:
            return False

    @classmethod
    def get_free_port_count(cls):
        start_port, end_port = cls.get_port_range()
        return RelayPort.objects.filter(
            status='free',
            port__gte=start_port,
            port__lte=end_port
        ).count()

    @classmethod
    def generate_ssh_keypair(cls, key_type='rsa', key_size=2048):
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
            private_key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)
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
    def install_session_pubkey(cls, private_pem: str, session_id) -> str:
        private_key = serialization.load_pem_private_key(private_pem.encode(), password=None)
        public_openssh = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.OpenSSH,
            format=serialization.PublicFormat.OpenSSH,
        ).decode('utf-8')
        comment = f"session-{session_id}"
        line = f"{public_openssh} {comment}"
        auth_path = '/home/relay_user/.ssh/authorized_keys'
        try:
            auth = Path(auth_path)
            auth.parent.mkdir(parents=True, exist_ok=True)
            existing = auth.read_text() if auth.exists() else ''
            kept = [l for l in existing.splitlines() if comment not in l and l.strip()]
            kept.append(line)
            auth.write_text('\n'.join(kept) + '\n')
            try:
                import pwd
                uid = pwd.getpwnam('relay_user').pw_uid
                gid = pwd.getpwnam('relay_user').pw_gid
                os.chown(auth_path, uid, gid)
            except Exception:
                pass
            auth.chmod(0o600)
        except Exception as e:
            print(f'install_session_pubkey failed: {e}')
        return public_openssh

    @classmethod
    def generate_ssh_key(cls, session_id):
        private_key, _ = cls.generate_ssh_keypair(key_type='rsa', key_size=2048)
        cls.install_session_pubkey(private_key, session_id)
        return private_key
