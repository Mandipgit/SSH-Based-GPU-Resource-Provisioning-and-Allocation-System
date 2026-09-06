import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and render running headers, footers and page counts"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip decorations on the cover page
            return
        
        self.saveState()
        self.setFont('Helvetica', 8)
        self.setFillColor(HexColor('#64748B'))
        
        # Running Header
        self.drawString(54, 11 * 72 - 36, 'GPU Resource Provisioning Platform — Server Architecture & Functionality Manual')
        self.setStrokeColor(HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)
        
        # Running Footer
        self.line(54, 46, 8.5 * 72 - 54, 46)
        self.drawString(54, 32, 'Comprehensive Architectural, Functional & Simulation Reference Manual')
        page_str = f'Page {self._pageNumber} of {page_count}'
        self.drawRightString(8.5 * 72 - 54, 32, page_str)
        self.restoreState()


def create_callout(title, text, is_technical=False, width=504):
    """Generate styled callout boxes for plain-English vs technical deep-dives"""
    bg_color = HexColor('#F0FDF4') if not is_technical else HexColor('#F8FAFC')
    border_color = HexColor('#22C55E') if not is_technical else HexColor('#3B82F6')
    title_color = HexColor('#166534') if not is_technical else HexColor('#1E40AF')
    icon = '💡 Non-Technical Concept (In Plain English):' if not is_technical else '⚙️ Technical Architecture & Under-the-Hood Mechanics:'
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CalloutTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=title_color
    )
    body_style = ParagraphStyle(
        'CalloutBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=HexColor('#1E293B')
    )
    
    content = [
        Paragraph(f'<b>{icon} {title}</b>', title_style),
        Spacer(1, 4),
        Paragraph(text, body_style)
    ]
    
    t = Table([[content]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('LINELEFT', (0,0), (-1,-1), 3.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    return t


def build_pdf(filename='GPU_Server_Architecture_and_Specifications.pdf'):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    c_primary = HexColor('#0F172A')
    c_secondary = HexColor('#1E293B')
    c_accent = HexColor('#0284C7')
    c_danger = HexColor('#DC2626')
    
    doc_title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=c_primary
    )
    
    doc_sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_accent
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=5,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_secondary,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    
    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_accent,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=HexColor('#334155'),
        spaceAfter=5
    )
    
    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=HexColor('#0F172A')
    )
    
    table_hdr_style = ParagraphStyle(
        'TableHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=HexColor('#FFFFFF')
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=HexColor('#1E293B')
    )
    
    story = []
    
    # =============================================================
    # COVER / HEADER
    # =============================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph('SSH-BASED GPU RESOURCE PROVISIONING & ALLOCATION SYSTEM', doc_sub_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph('Complete Server Architecture, App-by-App Functionality & Simulation Audit Manual', doc_title_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width='100%', thickness=2.5, color=c_accent, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        'This exhaustive technical and conceptual reference manual documents every facet of the backend server. '
        'Structured into distinct, self-contained chapters for every Django application, this document provides '
        'parallel perspectives: high-level plain-English workflows and real-world analogies for non-technical readers, '
        'alongside deep mathematical models, database schemas, REST API contracts, cryptographic protocols, '
        'and state machines for software architects and systems engineers. Chapter 10 presents an unfiltered audit '
        'of all production vs simulated subsystems.',
        body_style
    ))
    story.append(Spacer(1, 4))
    
    meta_data = [
        [Paragraph('<b>Backend Framework</b>', table_cell_style), Paragraph('Django 5.x, Django REST Framework (DRF), SimpleJWT', table_cell_style)],
        [Paragraph('<b>Database Layer</b>', table_cell_style), Paragraph('PostgreSQL with atomic transactions and row-level locking (<code>select_for_update</code>)', table_cell_style)],
        [Paragraph('<b>Networking & Tunneling</b>', table_cell_style), Paragraph('Dynamic Relay Port Pooling (40000-50000), Reverse SSH Proxy handshakes', table_cell_style)],
        [Paragraph('<b>Cryptographic Security</b>', table_cell_style), Paragraph('RSA 2048-bit and Ed25519 OpenSSH keypair generation via <code>cryptography.hazmat</code>', table_cell_style)],
        [Paragraph('<b>Billing Engine</b>', table_cell_style), Paragraph('Atomic Escrow Hold & Settle, 90/10 Host-Platform Split, Fractional-Second Decimal Math', table_cell_style)],
        [Paragraph('<b>API Documentation</b>', table_cell_style), Paragraph('OpenAPI 3.0, Swagger UI, Redoc, Django Administration Portal', table_cell_style)],
    ]
    meta_table = Table(meta_data, colWidths=[140, 364])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), HexColor('#F1F5F9')),
        ('BACKGROUND', (1,0), (1,-1), HexColor('#FFFFFF')),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    
    # =============================================================
    # EXECUTIVE OVERVIEW
    # =============================================================
    story.append(Paragraph('Executive Overview: The Decentralized GPU Cloud', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(create_callout(
        'The Peer-to-Peer GPU Paradigm',
        'Large-scale Artificial Intelligence training, Large Language Models (LLMs), and 3D computer graphics '
        'require massive GPU power. Centralized hyperscalers (AWS, Azure, GCP) charge premium rates that are inaccessible '
        'to independent developers, students, and small enterprises. Conversely, millions of high-performance gaming rigs, '
        'workstations, and private server clusters sit idle for over 18 hours every day.<br/><br/>'
        'This platform establishes a <b>decentralized computing marketplace</b>: Individuals with GPUs (<b>Hosts</b>) '
        'monetize their hardware by sharing compute cycles. Consumers needing compute (<b>Renters</b>) search, filter, and rent '
        'GPUs with zero long-term commitments. The central server ensures safety: it locks funds in escrow, verifies machine uptime, '
        'allocates encrypted networking tunnels, streams live hardware diagnostics, and guarantees instant payouts upon job completion.',
        is_technical=False
    ))
    story.append(Spacer(1, 6))
    
    story.append(create_callout(
        'Central Server Responsibilities & Architectural Planes',
        'The central Django backend acts as the authoritative coordinator without ever storing or intercepting user payload data: '
        '<br/>• <b>Control Plane:</b> Handles user authentication, RBAC authorization, marketplace listings, hardware capability discovery, and session state machines.'
        '<br/>• <b>Financial & Settlement Plane:</b> Pre-authorizes escrow holds, computes precise usage costs down to fractional seconds, deducts 10% platform fees, credits 90% net earnings to host wallets, and issues instantaneous refunds for unused booked time.'
        '<br/>• <b>Connectivity & Cryptographic Plane:</b> Manages dynamic relay port leases, generates ephemeral RSA/Ed25519 keypairs, coordinates reverse SSH handshakes, and issues one-line connection strings.'
        '<br/>• <b>Telemetry & Governance Plane:</b> Ingests periodic hardware health metrics (temperature, VRAM, GPU compute utilization), penalizes unreliable nodes, and provides moderation safeguards.',
        is_technical=True
    ))
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTER 1: SYSTEM ARCHITECTURE & NETWORKING
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapter 1: System Architecture, Core Workflows & Networking Protocols', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(Paragraph(
        'The central engineering challenge in a peer-to-peer compute platform is **NAT Traversal and Firewall Bypass**. '
        'Host machines reside behind residential routers, dynamic IP addresses, and carrier-grade NATs (CGNAT), making '
        'incoming connections impossible without manual port forwarding. The platform resolves this via a centralized '
        '**SSH Reverse-Relay Architecture**.',
        body_style
    ))
    
    story.append(Paragraph('End-to-End Operational Lifecycle', h2_style))
    wf_data = [
        [Paragraph('<b>Lifecycle Step</b>', table_hdr_style), Paragraph('<b>Non-Technical Perspective</b>', table_hdr_style), Paragraph('<b>Technical Engine Execution & Database Flow</b>', table_hdr_style)],
        [
            Paragraph('<b>1. Discovery</b>', table_cell_style),
            Paragraph('Renter filters the marketplace by GPU model, VRAM size, hourly rate, or host reliability rating.', table_cell_style),
            Paragraph('<code>GET /api/gpus/</code> queries the <code>GPU</code> model with active filters (<code>is_available=True</code>, <code>host__status="online"</code>).', table_cell_style)
        ],
        [
            Paragraph('<b>2. Reservation & Hold</b>', table_cell_style),
            Paragraph('Renter books 5 hours. The total estimated cost is locked in escrow in the renter\'s wallet.', table_cell_style),
            Paragraph('<code>POST /api/sessions/create/</code> validates wallet <code>available_balance</code>. Invokes <code>BillingService.hold_funds()</code> locking <code>hold_amount</code>. Calls <code>RelayService.allocate_port()</code> with row-level lock (<code>select_for_update</code>) on <code>RelayPort</code> table.', table_cell_style)
        ],
        [
            Paragraph('<b>3. Host Polling</b>', table_cell_style),
            Paragraph('The host background worker daemon detects a new rental job and accepts it.', table_cell_style),
            Paragraph('Host daemon calls <code>GET /api/sessions/host/pending/</code>. Retrieves <code>session_id</code>, leased <code>relay_server_port</code>, and ephemeral RSA private key (<code>relay_auth_key</code>).', table_cell_style)
        ],
        [
            Paragraph('<b>4. Container & Tunnel Setup</b>', table_cell_style),
            Paragraph('Host node spins up an isolated environment and establishes an encrypted connection tunnel.', table_cell_style),
            Paragraph('Host daemon initializes isolated Docker container with GPU passthrough (<code>--gpus all</code>), opens reverse SSH tunnel (<code>ssh -R <leased_port>:localhost:22 renter@<relay_host></code>), and sends status <code>ACTIVE</code> via <code>PATCH /api/sessions/host/<id>/status/</code>.', table_cell_style)
        ],
        [
            Paragraph('<b>5. Active Session & Renter Access</b>', table_cell_style),
            Paragraph('The rental officially goes live. The renter pastes the connection command into their terminal to start working.', table_cell_style),
            Paragraph('Server stamps <code>active_time = timezone.now()</code>, issues <code>ssh_connection_string = "ssh renter@<relay_host> -p <leased_port>"</code>, and notifies renter. <b>The billing clock is now running.</b>', table_cell_style)
        ],
        [
            Paragraph('<b>6. Telemetry Monitoring</b>', table_cell_style),
            Paragraph('Live hardware performance stats (temperature, VRAM usage, utilization %) stream to both dashboards.', table_cell_style),
            Paragraph('Host daemon queries local <code>nvidia-smi</code> and transmits metrics to <code>POST /api/sessions/host/<id>/heartbeat/</code>, inserting real-time <code>SessionMetric</code> database rows.', table_cell_style)
        ],
        [
            Paragraph('<b>7. Session Stop & Settlement</b>', table_cell_style),
            Paragraph('Renter stops the session early. Unspent funds are refunded immediately, and the host receives 90% payment.', table_cell_style),
            Paragraph('<code>POST /api/sessions/<id>/stop/</code> triggers <code>BillingService.process_rental_payment()</code>: computes exact elapsed duration down to seconds, releases the escrow hold, deducts actual cost, credits 90% to host wallet, records 10% platform fee, refunds unused balance, marks GPU available, and releases relay port.', table_cell_style)
        ],
    ]
    wf_table = Table(wf_data, colWidths=[90, 175, 239])
    wf_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#FFFFFF'), HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(wf_table)
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTER 2: USERS APP
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapter 2: The `users` App — Identity, RBAC, Profiles & Node Security', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(create_callout(
        'User Identities & Dedicated Node Security',
        'Users can register as Renters (who buy compute), Hosts (who sell compute), or Both. '
        'Because host machines need to run automated worker daemons in the background 24/7, the system issues '
        'machine-specific **Host API Keys** (<code>host_...</code>). This prevents the host from ever needing to store '
        'their personal email password on an unattended machine.',
        is_technical=False
    ))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph('Technical Models, Fields & Logic', h2_style))
    story.append(Paragraph(
        '• <b><code>User</code> Model:</b> Custom user model extending <code>AbstractBaseUser</code> and <code>PermissionsMixin</code>. Key fields: <code>id</code> (UUID PK), <code>email</code> (unique, indexed), <code>role</code> (<code>renter</code>, <code>host</code>, <code>both</code>, <code>admin</code>), <code>host_api_key</code> (unique token for daemon auth), <code>is_email_verified</code>, <code>is_active</code>.<br/>'
        '• <b><code>HostProfile</code> Model:</b> One-to-one extension profile created automatically for hosts. Attributes include: <code>gpu_name</code>, <code>vram_gb</code>, <code>driver_version</code>, <code>cuda_version</code>, <code>status</code> (<code>online</code>, <code>offline</code>, <code>restricted</code>, <code>suspended</code>), <code>uptime_percentage</code>, <code>reliability_score</code> (starts at 100), <code>penalty_points</code>, <code>total_earnings</code>, <code>pending_payout</code>, <code>total_rental_hours</code>, <code>auto_accept</code> (boolean), <code>max_rental_hours</code>.<br/>'
        '• <b><code>HostProfile.apply_penalty(points, reason)</code>:</b> Deducts reliability score (<code>score = max(0, 100 - penalty_points * 2)</code>), updates status to <code>restricted</code> if points &ge; 50 or <code>suspended</code> if points &ge; 100, and records a <code>HostPenaltyLog</code> entry.<br/>'
        '• <b><code>LoginAttempt</code> Model:</b> Enforces brute-force defense by recording IP-level attempt counts and locking offending IPs upon multiple consecutive failures.<br/>'
        '• <b><code>PasswordResetToken</code> & <code>EmailVerificationToken</code>:</b> Provide cryptographically secure, time-expiring UUID tokens for identity recovery.',
        body_style
    ))
    
    user_endpoints = [
        ('POST /api/auth/register/', 'Public', 'Registers user, hashes password via Argon2/PBKDF2, provisions Wallet, issues email token.'),
        ('POST /api/auth/login/', 'Public', 'Verifies credentials, checks LoginAttempt lockout status, returns JWT access/refresh tokens.'),
        ('POST /api/auth/token/refresh/', 'Public', 'Rotates expired JWT access token using valid refresh token.'),
        ('GET/PATCH /api/auth/profile/', 'JWT Auth', 'Fetches or modifies authenticated user personal and contact details.'),
        ('GET/PATCH /api/auth/host/profile/', 'Host Auth', 'Retrieves or configures host hardware profile, auto-accept mode, and schedule.'),
        ('POST /api/auth/host/api-key/', 'Host Auth', 'Generates a secure, random <code>host_<secrets.token_urlsafe(32)></code> daemon token.'),
        ('POST /api/auth/host/api-key/validate/', 'Public', 'Host daemon validates its API key on boot before polling pending rental queues.'),
        ('POST /api/auth/password-reset/request/', 'Public', 'Issues secure password reset token with 24-hour expiration.'),
        ('POST /api/auth/password-reset/confirm/', 'Public', 'Validates reset token and sets new hashed password.'),
    ]
    u_table_data = [[Paragraph('<b>Endpoint</b>', table_hdr_style), Paragraph('<b>Auth</b>', table_hdr_style), Paragraph('<b>Functional Action Description</b>', table_hdr_style)]]
    for ep, auth, desc in user_endpoints:
        u_table_data.append([Paragraph(f'<code>{ep}</code>', code_style), Paragraph(auth, table_cell_style), Paragraph(desc, table_cell_style)])
    
    u_table = Table(u_table_data, colWidths=[185, 65, 254])
    u_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#FFFFFF'), HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(u_table)
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTER 3: GPUS APP
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapter 3: The `gpus` App — Fleet Inventory, Specs & Heartbeat Monitoring', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(create_callout(
        'GPU Marketplace & Zero-Stale-Listing Protection',
        'Hosts register the exact hardware specs of their graphics cards (e.g. NVIDIA RTX 4090, 24GB VRAM, CUDA 12.2) '
        'and define their own hourly rental price in NPR. The platform guarantees that renters never attempt to book an offline card: '
        'if a host machine powers off or disconnects, the system detects the missing heartbeat and delists the card from the marketplace within minutes.',
        is_technical=False
    ))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph('Data Models, Availability Rules & Heartbeat Tracking', h2_style))
    story.append(Paragraph(
        '• <b><code>GPU</code> Model:</b> Primary inventory entity. Key attributes: <code>host</code> (FK to <code>HostProfile</code>), <code>gpu_name</code> (e.g., RTX 4090), <code>vram_gb</code> (integer VRAM in GB), <code>cuda_cores</code>, <code>memory_bandwidth</code>, <code>compute_capability</code>, <code>driver_version</code>, <code>cuda_version</code>, <code>price_per_hour</code> (validated &ge; NPR 0.01), <code>is_available</code> (boolean), <code>current_session_id</code> (UUID), <code>location</code>, <code>total_rental_hours</code>, <code>total_earnings</code>, <code>total_sessions</code>.<br/>'
        '• <b>The <code>is_rentable</code> Property:</b> Evaluates dynamic rentability:<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;<code>return (self.is_available and self.current_session_id is None and self.host.status == "online")</code><br/>'
        '• <b>GPU Lifecycle Methods:</b><br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;• <code>mark_rented(session_id)</code>: Sets <code>is_available=False</code> and records <code>current_session_id</code>.<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;• <code>mark_available()</code>: Clears <code>current_session_id</code> and sets <code>is_available=True</code>.<br/>'
        '&nbsp;&nbsp;&nbsp;&nbsp;• <code>update_stats(hours, earnings)</code>: Accumulates total rental hours and revenue in Decimal precision.<br/>'
        '• <b>Heartbeat Monitor (<code>GPUHeartbeatView</code>):</b> Host background agents submit periodic telemetry to <code>POST /api/gpus/heartbeat/</code>. The server updates <code>host.last_heartbeat = now()</code> and marks <code>host.status = "online"</code>.',
        body_style
    ))
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTER 4: SESSIONS APP
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapter 4: The `sessions` App — State Engine, SSH Relay & Telemetry', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(create_callout(
        'The Core Heartbeat of the Entire Platform',
        'A Session is the legal and technical rental contract. It begins the instant a user selects a GPU and duration. '
        'It supervises container creation on the host, establishes the encrypted SSH communication bridge, records live '
        'temperature and GPU utilization charts, and calculates the exact final bill when the session stops.',
        is_technical=False
    ))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph('Complete 9-Stage Session State Machine', h2_style))
    states_data = [
        [Paragraph('<b>State Code</b>', table_hdr_style), Paragraph('<b>System Meaning & Daemon Trigger</b>', table_hdr_style), Paragraph('<b>Financial / Billing Clock Status</b>', table_hdr_style)],
        [Paragraph('<code>pending</code>', code_style), Paragraph('Renter creates request; waiting for host pickup.', table_cell_style), Paragraph('Funds placed on <b>HOLD</b> (reserved, not deducted).', table_cell_style)],
        [Paragraph('<code>starting</code>', code_style), Paragraph('Host daemon polls session and begins container prep.', table_cell_style), Paragraph('Billing paused (clock not running).', table_cell_style)],
        [Paragraph('<code>container_running</code>', code_style), Paragraph('Docker container with GPU isolation is running on host.', table_cell_style), Paragraph('Billing paused.', table_cell_style)],
        [Paragraph('<code>tunnel_connecting</code>', code_style), Paragraph('Host establishes reverse SSH tunnel to relay port.', table_cell_style), Paragraph('Billing paused.', table_cell_style)],
        [Paragraph('<code>active</code>', code_style), Paragraph('Tunnel confirmed live. SSH credentials issued to renter.', table_cell_style), Paragraph('<b>BILLING CLOCK STARTS</b> (<code>active_time = now()</code>).', table_cell_style)],
        [Paragraph('<code>stopping</code>', code_style), Paragraph('Stop initiated by renter or duration expired.', table_cell_style), Paragraph('Usage computed down to fractional seconds.', table_cell_style)],
        [Paragraph('<code>completed</code>', code_style), Paragraph('Container destroyed; relay port released.', table_cell_style), Paragraph('<b>Settled:</b> 90% to host, 10% platform, refund unused.', table_cell_style)],
        [Paragraph('<code>failed</code>', code_style), Paragraph('Host error or setup failure during startup.', table_cell_style), Paragraph('<b>100% Full Refund:</b> Hold released, zero fee.', table_cell_style)],
        [Paragraph('<code>terminated</code>', code_style), Paragraph('Terminated early by admin or host offline dropout.', table_cell_style), Paragraph('Refund processed; compensation applied if insured.', table_cell_style)],
    ]
    st_table = Table(states_data, colWidths=[90, 214, 200])
    st_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#FFFFFF'), HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(st_table)
    story.append(Spacer(1, 8))
    
    story.append(Paragraph('Cryptographic Key Generation & Port Management Services', h2_style))
    story.append(Paragraph(
        '• <b><code>RelayService.allocate_port(session_id)</code>:</b> Finds the lowest available port in range <code>40000-50000</code> using <code>RelayPort.objects.select_for_update().filter(status="free").first()</code>, leasing the port atomically to guarantee zero duplicate port collisions under high concurrent load.<br/>'
        '• <b><code>RelayService.generate_ssh_keypair()</code>:</b> Uses Python\'s <code>cryptography.hazmat.primitives.asymmetric.rsa</code> library to generate an authentic 2048-bit RSA keypair with 65537 public exponent. Formats private key in PEM format and public key in OpenSSH wire format.<br/>'
        '• <b><code>SessionMetric</code> Ingestion:</b> Hosts report telemetry via <code>POST /api/sessions/host/<id>/heartbeat/</code>. Captures: <code>gpu_temperature_c</code>, <code>gpu_utilization_pct</code>, <code>memory_used_mib</code>, <code>power_usage_w</code>, <code>fan_speed_pct</code>, <code>cpu_usage_pct</code>, <code>ram_usage_mb</code>.',
        body_style
    ))
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTER 5: WALLETS APP
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapter 5: The `wallets` App & Financial Engine', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(create_callout(
        'How Money Moves: The Two-Stage Hold & Settle Model',
        'When a user rents a GPU for 5 hours at NPR 100/hr, NPR 500 is placed on <b>HOLD</b> (locked in escrow). '
        'The money is NOT yet deducted. If the user stops after 1.5 hours, the system charges NPR 150, '
        'instantly returns NPR 350 back to their available balance, and transfers NPR 135 (90%) to the host.',
        is_technical=False
    ))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph('Mathematical Financial Rules & Transaction Ledger', h2_style))
    story.append(Paragraph(
        'All financial operations execute inside atomic database transactions (<code>@transaction.atomic</code>) with <code>select_for_update()</code> row locks on the <code>Wallet</code> table:',
        body_style
    ))
    
    math_rows = [
        [Paragraph('<b>Financial Operation</b>', table_hdr_style), Paragraph('<b>Mathematical Formula & Decimal Logic</b>', table_hdr_style), Paragraph('<b>Transaction Ledger Type</b>', table_hdr_style)],
        [
            Paragraph('<b>1. Pre-Authorization</b>', table_cell_style),
            Paragraph('<code>wallet.hold_amount += total_amount</code><br/><code>available_balance = balance - hold_amount</code>', table_cell_style),
            Paragraph('<code>type = "hold"</code>', table_cell_style)
        ],
        [
            Paragraph('<b>2. Usage Calculation</b>', table_cell_style),
            Paragraph('<code>used_hours = (end_time - active_time).total_seconds() / 3600</code><br/><code>actual_cost = used_hours * price_per_hour</code>', table_cell_style),
            Paragraph('Computed in Decimal', table_cell_style)
        ],
        [
            Paragraph('<b>3. Release Hold</b>', table_cell_style),
            Paragraph('<code>wallet.hold_amount -= total_amount</code>', table_cell_style),
            Paragraph('Hold cleared', table_cell_style)
        ],
        [
            Paragraph('<b>4. Unspent Refund</b>', table_cell_style),
            Paragraph('<code>refund = total_amount - actual_cost</code><br/><code>if refund > 0: wallet.balance += refund</code>', table_cell_style),
            Paragraph('<code>type = "refund"</code>', table_cell_style)
        ],
        [
            Paragraph('<b>5. Host Payout Split</b>', table_cell_style),
            Paragraph('<code>platform_fee = actual_cost * Decimal("0.10")</code> (10%)<br/><code>host_earnings = actual_cost - platform_fee</code> (90% to host)', table_cell_style),
            Paragraph('<code>type = "rental_payment"</code><br/><code>type = "host_earning"</code><br/><code>type = "platform_fee"</code>', table_cell_style)
        ],
        [
            Paragraph('<b>6. Session Failure Release</b>', table_cell_style),
            Paragraph('<code>wallet.hold_amount -= total_amount</code> (0 deduction)', table_cell_style),
            Paragraph('<code>type = "release_hold"</code>', table_cell_style)
        ],
    ]
    m_table = Table(math_rows, colWidths=[115, 234, 155])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#FFFFFF'), HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTERS 6 TO 9: NOTIFICATIONS, REVIEWS, DASHBOARD, ADMIN
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapters 6 to 9: Notifications, Reviews, Dashboard & Governance', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(Paragraph('Chapter 6: The `notifications` App — Real-Time Alerting Engine', h2_style))
    story.append(Paragraph(
        'The <code>notifications</code> app delivers transactional, operational, and security alerts to renters and hosts. '
        'The centralized <code>NotificationService</code> provides standardized asynchronous dispatchers: '
        '<br/>• <code>notify_session_started(session)</code>: Transmits SSH connection string and confirmation to renter.'
        '<br/>• <code>notify_session_completed(session, billing)</code>: Issues itemized billing receipt and payout notice.'
        '<br/>• <code>notify_session_terminated(session, reason)</code>: Warns of node dropouts or administrative interventions.'
        '<br/>• <code>notify_refund_processed(user, amount)</code>: Confirms balance re-crediting after session stops.'
        '<br/>• <code>notify_penalty_applied(host, points, reason)</code>: Alerts hosts of reliability score deductions.',
        body_style
    ))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph('Chapter 7: The `reviews` App — Verified Multi-Criteria Reputation', h2_style))
    story.append(Paragraph(
        'The <code>reviews</code> app safeguards marketplace trust through verified feedback tied directly to completed sessions: '
        '<br/>• <b>Multi-Criteria Ratings (1 to 5 Stars):</b> Overall Rating, Host Communication Rating, Reliability Rating, and GPU Hardware Performance Rating.'
        '<br/>• <b>Verification Guard:</b> A review can strictly only be authored for a completed session by the authenticated renter.'
        '<br/>• <b><code>ReviewQuerySet.summary_stats()</code>:</b> Custom ORM manager computing average ratings, verified counts, and 1-5 star distributions in a single SQL aggregate query.'
        '<br/>• <b>Host Response Mechanism:</b> Hosts can submit public responses to reviews via <code>HostReviewResponseView</code>.',
        body_style
    ))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph('Chapter 8: The `dashboard` App — Role-Aware Analytics & Security Logs', h2_style))
    story.append(Paragraph(
        'The <code>dashboard</code> app powers the user interface with tailored data streams: '
        '<br/>• <b>Renter Dashboard:</b> Active workloads, available wallet balance, recent sessions, cumulative compute spend.'
        '<br/>• <b>Host Dashboard:</b> GPU fleet utilization (total/available/rented), revenue (today, this week, this month), reliability score, uptime %, and per-GPU hourly utilization charts.'
        '<br/>• <b>Admin Analytics:</b> Gross Merchandise Value (GMV), platform fee collections, active host nodes, active session counts.'
        '<br/>• <b>Activity Auditing (<code>UserActivityLog</code>):</b> Immutable audit trail logging user interactions (login, session start, profile edit, payment) with IP and user agent metadata.',
        body_style
    ))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph('Chapter 9: The `admin_panel` App — Platform Governance & Moderation', h2_style))
    story.append(Paragraph(
        'Provides platform administrators with oversight and dispute resolution mechanisms: '
        '<br/>• <b>Emergency Session Kill Switch:</b> Force-terminates rogue or unresponsive sessions and triggers automated refunds.'
        '<br/>• <b>Host Node Moderation:</b> Inspects node reliability scores, resolves penalty appeals, and suspends abusive hosts.'
        '<br/>• <b>Financial Dispute Handling:</b> Issues manual wallet compensation and refund adjustments with audit logging.',
        body_style
    ))
    story.append(Spacer(1, 10))
    
    # =============================================================
    # CHAPTER 10: SIMULATION AUDIT
    # =============================================================
    story.append(PageBreak())
    story.append(Paragraph('Chapter 10: Comprehensive Platform Simulation Audit', h1_style))
    story.append(HRFlowable(width='100%', thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=5))
    
    story.append(create_callout(
        'Full Transparency: Simulated vs Production-Ready Subsystems',
        'To facilitate transparent technical audits, academic presentations, hackathon evaluations, and commercial roadmap planning, '
        'this chapter provides an unfiltered matrix detailing which platform components are 100% real and production-functional '
        'versus which modules are simulated or mock-backed.',
        is_technical=False
    ))
    story.append(Spacer(1, 6))
    
    sim_data = [
        [Paragraph('<b>Subsystem / Component</b>', table_hdr_style), Paragraph('<b>Current Status</b>', table_hdr_style), Paragraph('<b>Detailed Technical Reality & Simulation Analysis</b>', table_hdr_style)],
        [
            Paragraph('<b>Cryptographic SSH Keypair Generator</b>', table_cell_style),
            Paragraph('<font color="#16A34A"><b>100% REAL</b></font>', table_cell_style),
            Paragraph('Uses genuine Python <code>cryptography.hazmat</code> primitives to mathematically generate real 2048-bit RSA and Ed25519 OpenSSH keys and PEM blocks.', table_cell_style)
        ],
        [
            Paragraph('<b>Relay Port Leasing Engine</b>', table_cell_style),
            Paragraph('<font color="#16A34A"><b>100% REAL</b></font>', table_cell_style),
            Paragraph('Real PostgreSQL database table managing ports <code>40000-50000</code> with row-level locking (<code>select_for_update</code>) preventing double allocations under concurrent load.', table_cell_style)
        ],
        [
            Paragraph('<b>Financial Ledger & Billing Engine</b>', table_cell_style),
            Paragraph('<font color="#16A34A"><b>100% REAL</b></font>', table_cell_style),
            Paragraph('Fully functional double-entry accounting in PostgreSQL: atomic hold, release, fractional-second usage billing, 90/10 split, and instant refunds.', table_cell_style)
        ],
        [
            Paragraph('<b>Marketplace Query & Ratings Engine</b>', table_cell_style),
            Paragraph('<font color="#16A34A"><b>100% REAL</b></font>', table_cell_style),
            Paragraph('Full SQL filtering by VRAM, price, CUDA version, and real-time calculation of host reputation scores and review distributions.', table_cell_style)
        ],
        [
            Paragraph('<b>SSH Reverse-Tunnel Relay Server</b>', table_cell_style),
            Paragraph('<font color="#D97706"><b>SIMULATED</b></font>', table_cell_style),
            Paragraph('The database orchestrates port leases and generates valid SSH strings. The external reverse-tunnel proxy server (Frp / SSH jump host) endpoint defaults to <code>127.0.0.1</code> / <code>RELAY_HOST</code>.', table_cell_style)
        ],
        [
            Paragraph('<b>Host Container Provisioning Daemon</b>', table_cell_style),
            Paragraph('<font color="#D97706"><b>MOCK-ENABLED</b></font>', table_cell_style),
            Paragraph('Host polling and status update API endpoints are fully implemented. For testing without physical GPUs, status transitions can be stepped manually via REST calls.', table_cell_style)
        ],
        [
            Paragraph('<b>GPU Hardware Telemetry Ingestion</b>', table_cell_style),
            Paragraph('<font color="#2563EB"><b>HYBRID</b></font>', table_cell_style),
            Paragraph('Backend storage and aggregation of temperature, memory, and load are real; values are supplied by host heartbeat payloads (simulated or from <code>nvidia-smi</code>).', table_cell_style)
        ],
        [
            Paragraph('<b>Fiat Payment Gateways</b>', table_cell_style),
            Paragraph('<font color="#D97706"><b>SIMULATED</b></font>', table_cell_style),
            Paragraph('Stripe/eSewa/Khalti balance crediting operates on internal wallet balance. Live external bank webhooks are plug-and-play ready.', table_cell_style)
        ],
        [
            Paragraph('<b>Work Protection Insurance</b>', table_cell_style),
            Paragraph('<font color="#2563EB"><b>HYBRID</b></font>', table_cell_style),
            Paragraph('The 20¢/hour insurance fee and policy tracking are active; automated compensation claims are administrator-reviewed.', table_cell_style)
        ],
    ]
    sim_table = Table(sim_data, colWidths=[115, 90, 299])
    sim_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#FFFFFF'), HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(sim_table)
    story.append(Spacer(1, 8))
    
    story.append(Paragraph('Roadmap to 100% Bare-Metal Production Deployment', h2_style))
    story.append(Paragraph(
        'Transitioning from the current demonstration architecture to commercial nationwide production requires exactly three operational steps: '
        '<br/>1. <b>Deploy a Dedicated Public Relay Server:</b> Configure a Linux cloud instance with OpenSSH <code>GatewayPorts yes</code> or <code>frps</code> (Fast Reverse Proxy server) and point Django\'s <code>RELAY_HOST</code> setting to its public IP address.'
        '<br/>2. <b>Run the Python Host Agent Daemon on Physical Machines:</b> Execute the host worker script on nodes equipped with NVIDIA drivers and Docker (<code>nvidia-container-toolkit</code>). The agent will automatically call <code>nvidia-smi</code> and establish live reverse SSH tunnels.'
        '<br/>3. <b>Attach Live Payment Gateway Credentials:</b> Insert live Stripe / eSewa API keys into Django environment variables to enable automated credit card and bank balance top-ups.',
        body_style
    ))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f'Successfully generated expanded PDF: {filename}')

if __name__ == '__main__':
    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'GPU_Server_Architecture_and_Specifications.pdf')
    build_pdf(out_file)
