#!/usr/bin/env python3
import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6b7280"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "Sistema SIG - Cementerio General de Los Ángeles | Guía Docker Swarm & HA")
            self.setStrokeColor(colors.HexColor("#e5e7eb"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Footer
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(8.5 * inch - 54, 30, page_str)
        self.drawString(54, 30, "Confidencial - Licitación Mercado Público 2411-8-LE25 | Autores: Bryan Ahumada & Johan Muñoz")
        self.setStrokeColor(colors.HexColor("#e5e7eb"))
        self.setLineWidth(0.5)
        self.line(54, 40, 8.5 * inch - 54, 40)
        self.restoreState()

def build_pdf(filename="GUIA_ALTA_DISPONIBILIDAD_DOCKER_SWARM.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#3b82f6'),
        spaceAfter=15
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#4b5563')
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1e40af'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937'),
        leftIndent=15,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#111827'),
    )

    story = []

    # Title Banner
    story.append(Paragraph("Guía Maestra de Arquitectura, Docker Swarm y Alta Disponibilidad", title_style))
    story.append(Paragraph("Plataforma Web y Sistema de Información Geográfica (SIG) — Cementerio General de Los Ángeles", subtitle_style))
    
    meta_text = """
    <b>Licitación Mercado Público:</b> 2411-8-LE25 &nbsp;|&nbsp; 
    <b>Autores:</b> Bryan Ahumada & Johan Muñoz &nbsp;|&nbsp; 
    <b>Entorno:</b> Docker Swarm (Alta Disponibilidad Nativa)
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1e3a8a'), spaceAfter=14))

    # Section 1: Descripcion
    story.append(Paragraph("1. Descripción General del Proyecto", h1_style))
    story.append(Paragraph(
        "El presente proyecto moderniza el sistema de catastro y gestión funeraria del <b>Cementerio General de la Comuna de Los Ángeles</b> "
        "(Región del Biobío, Chile), situado en Camino San Antonio s/n / Av. Gabriela Mistral (Coordenadas: <code>-37.4732, -72.3229</code>). "
        "Integra una cartografía digital interactiva de los 5 patios topográficos sobre el polígono real del recinto, catastro histórico de mausoleos emblemáticos "
        "y un motor de búsqueda multifiltro de difuntos.",
        body_style
    ))
    story.append(Paragraph("<b>Stack Tecnológico Principal:</b>", body_style))
    story.append(Paragraph("• <b>Frontend:</b> React 18, Vite, Leaflet, Google Maps, Lucide Icons, Axios, Nginx.", bullet_style))
    story.append(Paragraph("• <b>Backend:</b> Python 3.10, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Gunicorn.", bullet_style))
    story.append(Paragraph("• <b>Capa de Datos:</b> PostgreSQL 16 + extensión geoespacial PostGIS 3.4 (Master y Réplica).", bullet_style))
    story.append(Paragraph("• <b>Balanceo & Ingress:</b> HAProxy 2.8 L7 (Web) y L4 TCP (PostgreSQL).", bullet_style))
    story.append(Paragraph("• <b>Orquestación:</b> Docker Swarm con Ingress Routing Mesh (Kernel IPVS).", bullet_style))

    # Section 2: Unidad 1 vs Unidad 2
    story.append(Spacer(1, 6))
    story.append(Paragraph("2. Evolución Arquitectónica: Unidad 1 vs Unidad 2", h1_style))
    
    comp_data = [
        [Paragraph("<b>Aspecto Técnico</b>", meta_style), Paragraph("<b>Unidad 1 (Nativo GCP)</b>", meta_style), Paragraph("<b>Unidad 2 (Docker Swarm)</b>", meta_style)],
        [Paragraph("Infraestructura", body_style), Paragraph("6 VMs Debian 13 en Compute Engine", body_style), Paragraph("Clúster Swarm multi-servicio replicado", body_style)],
        [Paragraph("Aislamiento", body_style), Paragraph("Demonios nativos systemd", body_style), Paragraph("Contenedores Docker multi-etapa ligeros", body_style)],
        [Paragraph("Redes", body_style), Paragraph("3 VPCs con IPs fijas (10.0.x.x)", body_style), Paragraph("Red virtual Overlay (cementerio_net)", body_style)],
        [Paragraph("Balanceo Web", body_style), Paragraph("HAProxy nativo en VM 1 (SPOF)", body_style), Paragraph("Servicio replicado (2 réplicas) en Swarm VIP", body_style)],
        [Paragraph("Balanceo BD", body_style), Paragraph("Clúster Patroni + etcd (:8008)", body_style), Paragraph("HAProxy TCP con failover automático ('backup')", body_style)],
        [Paragraph("Tolerancia a fallos", body_style), Paragraph("Manual / Failover por Patroni en VMs", body_style), Paragraph("Automática en todas las capas + Self-Healing", body_style)]
    ]
    t_comp = Table(comp_data, colWidths=[110, 190, 204])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0e7ff')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_comp)

    # Section 3: Diagnostico y Cambios
    story.append(Spacer(1, 8))
    story.append(Paragraph("3. Diagnóstico y Modificaciones Realizadas Paso a Paso", h1_style))
    story.append(Paragraph(
        "Al recibir el proyecto configurado para VMs nativas, se detectaron incompatibilidades clave que fueron corregidas:",
        body_style
    ))
    story.append(Paragraph("<b>1. Aislamiento con .dockerignore:</b> Se crearon archivos de exclusión en la raíz, frontend y backend para prevenir que <code>node_modules/</code> y <code>.venv/</code> locales saturaran las imágenes Docker.", bullet_style))
    story.append(Paragraph("<b>2. Inicialización de BD (01-init-postgis.sql):</b> Se automatizó la creación de <code>app_user</code> con contraseña <code>AppPassword123!</code> y permisos totales en <code>cementerio_db</code>.", bullet_style))
    story.append(Paragraph("<b>3. HAProxy DB (swarm/haproxy-db.cfg):</b> Se reemplazó el chequeo de Patroni (:8008) por el chequeo PostgreSQL nativo <code>option pgsql-check user postgres</code> y se configuró failover hacia la réplica con la directiva <code>backup</code>.", bullet_style))
    story.append(Paragraph("<b>4. Nginx y Backend:</b> Nginx se ajustó para servir <code>/usr/share/nginx/html</code> y hacer proxy a <code>http://app_backend:5000/api/</code>. Flask se conectó a <code>db_balancer:5000</code>.", bullet_style))
    story.append(Paragraph("<b>5. HAProxy Web Ingress (swarm/haproxy-web.cfg):</b> Se vinculó con el resolver DNS interno de Docker (<code>127.0.0.11:53</code>) y se configuró healthcheck de extremo a extremo en <code>GET /api/health</code>.", bullet_style))

    # Section 4: Teoria HA
    story.append(Spacer(1, 8))
    story.append(Paragraph("4. Teoría y Funcionamiento de Alta Disponibilidad en HAProxy", h1_style))
    story.append(Paragraph(
        "<b>La Regla Física de Redes:</b> Si una máquina o contenedor se apaga por completo, no puede ejecutar código de redirección. "
        "Por lo tanto, la Alta Disponibilidad entre balanceadores se resuelve mediante capas de coordinación:",
        body_style
    ))
    story.append(Paragraph("• <b>Keepalived + VRRP (IP Flotante):</b> En servidores físicos, dos nodos comparten una IP Virtual (VIP). Si el Master muere, el Backup asume la IP en <1s mediante Gratuitous ARP.", bullet_style))
    story.append(Paragraph("• <b>Directiva 'peers' de HAProxy:</b> Ambas instancias sincronizan sus tablas de sesiones activas (stick-tables) por el puerto 1024, evitando que los usuarios pierdan su login al conmutar.", bullet_style))
    story.append(Paragraph("• <b>En Google Cloud Platform (GCP):</b> Se sitúa un Cloud Network Load Balancer L4 de Google que vigila a las 2 VMs de HAProxy y conmuta el 100% del tráfico a la VM sana.", bullet_style))
    story.append(Paragraph("• <b>En Docker Swarm (Implementado):</b> Swarm utiliza el Ingress Routing Mesh (IPVS en el kernel). El puerto 8000 se asocia a una VIP interna. Si una réplica de HAProxy es destruida (<code>docker kill</code>), el kernel envía el tráfico inmediatamente a la otra réplica en el <b>mismo puerto 8000 sin caída</b>.", bullet_style))

    # Section 5: Matriz de Servicios Swarm
    story.append(PageBreak())
    story.append(Paragraph("5. Matriz de Servicios, Réplicas y Puertos en Docker Swarm", h1_style))
    
    svc_data = [
        [Paragraph("<b>Servicio</b>", meta_style), Paragraph("<b>Capa / Rol</b>", meta_style), Paragraph("<b>Réplicas</b>", meta_style), Paragraph("<b>Puertos Expuestos</b>", meta_style), Paragraph("<b>Alta Disponibilidad</b>", meta_style)],
        [Paragraph("cementerio_web_balancer", code_style), Paragraph("Capa 1: Ingress L7", body_style), Paragraph("<b>2 / 2</b>", body_style), Paragraph("*:8000, *:8404", body_style), Paragraph("Swarm VIP Routing Mesh", body_style)],
        [Paragraph("cementerio_app_frontend", code_style), Paragraph("Capa 2: React SPA Nginx", body_style), Paragraph("<b>2 / 2</b>", body_style), Paragraph("Interno (:80)", body_style), Paragraph("Balanceo L7 round-robin", body_style)],
        [Paragraph("cementerio_app_backend", code_style), Paragraph("Capa 2: Flask Gunicorn", body_style), Paragraph("<b>2 / 2</b>", body_style), Paragraph("Interno (:5000)", body_style), Paragraph("Balanceo L7 round-robin", body_style)],
        [Paragraph("cementerio_db_balancer", code_style), Paragraph("Capa 3: Proxy DB TCP", body_style), Paragraph("<b>1 / 1</b>", body_style), Paragraph("*:7000 (Stats)", body_style), Paragraph("Failover 'backup' a réplica", body_style)],
        [Paragraph("cementerio_db_primary", code_style), Paragraph("Capa 4: PostgreSQL Master", body_style), Paragraph("<b>1 / 1</b>", body_style), Paragraph("*:5432", body_style), Paragraph("Transaccional & Persistencia", body_style)],
        [Paragraph("cementerio_db_replica", code_style), Paragraph("Capa 4: PostgreSQL Réplica", body_style), Paragraph("<b>1 / 1</b>", body_style), Paragraph("*:5433", body_style), Paragraph("Lectura & Standby", body_style)],
        [Paragraph("cementerio_backup_server", code_style), Paragraph("Capa 5: Respaldos Cron", body_style), Paragraph("<b>1 / 1</b>", body_style), Paragraph("Volumen /backups", body_style), Paragraph("Dumps comprimidos .sql.gz", body_style)]
    ]
    t_svc = Table(svc_data, colWidths=[120, 105, 55, 95, 129])
    t_svc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_svc)

    # Section 6: Comandos Operativos
    story.append(Spacer(1, 10))
    story.append(Paragraph("6. Guía de Comandos Operativos", h1_style))
    
    cmd_text = """# Desplegar o actualizar el clúster completo:
docker stack deploy -c docker-stack.yml cementerio

# Ver el estado de todos los servicios y réplicas (2/2):
docker service ls

# Ver tareas individuales y salud de cada contenedor:
docker stack ps cementerio

# Ver logs en vivo del balanceador web:
docker service logs -f cementerio_web_balancer

# Detener el clúster:
docker stack rm cementerio"""
    
    t_cmd = Table([[Preformatted(cmd_text, code_style)]], colWidths=[504])
    t_cmd.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(t_cmd)

    # Section 7: Credenciales
    story.append(Spacer(1, 10))
    story.append(Paragraph("7. Credenciales y URLs de Acceso", h1_style))
    story.append(Paragraph("• <b>Plataforma Web Principal:</b> http://localhost:8000 (Ingress Swarm)", bullet_style))
    story.append(Paragraph("• <b>Panel Estadísticas HAProxy Web:</b> http://localhost:8404", bullet_style))
    story.append(Paragraph("• <b>Panel Estadísticas HAProxy DB:</b> http://localhost:7000", bullet_style))
    story.append(Paragraph("• <b>Usuario Administrador:</b> admin@losangeles.cl &nbsp;|&nbsp; <b>Contraseña:</b> Admin123!", bullet_style))
    story.append(Paragraph("• <b>Usuario Funcionario:</b> funcionario@losangeles.cl &nbsp;|&nbsp; <b>Contraseña:</b> Funcionario123!", bullet_style))
    story.append(Paragraph("• <b>Usuario Terreno:</b> terreno@losangeles.cl &nbsp;|&nbsp; <b>Contraseña:</b> Terreno123!", bullet_style))

    # Section 8: Protocolo de Demostracion
    story.append(Spacer(1, 10))
    story.append(Paragraph("8. Protocolo de Demostración Universitaria (El 'Show' de HA)", h1_style))
    story.append(Paragraph(
        "Para realizar la defensa ante el profesor demostrando <b>tolerancia a fallos real en vivo</b>:",
        body_style
    ))
    
    demo_steps = """Paso 1: Demostrar Funcionamiento Normal
- Abre http://localhost:8000 en el navegador y muestra el mapa de patios topográficos.
- En la terminal, corre: docker service ls (muestra réplicas 2/2).

Paso 2: Matar el Balanceador Web en Vivo (Capa 1)
- Ejecuta: docker kill $(docker ps -q -f name=cementerio_web_balancer | head -n 1)
- Inmediatamente recarga http://localhost:8000 o corre: curl http://localhost:8000/api/health
- Explicación: "El sistema responde 200 OK en el MISMO puerto 8000 sin caída gracias al Routing Mesh."

Paso 3: Demostrar Auto-Recuperación (Self-Healing)
- A los 5 segundos ejecuta: docker service ps cementerio_web_balancer
- Explicación: "Docker Swarm detectó la muerte de la réplica y levantó un nuevo contenedor automáticamente."

Paso 4: Matar el Backend Flask en Vivo (Capa 2)
- Ejecuta: docker kill $(docker ps -q -f name=cementerio_app_backend | head -n 1)
- Consulta: curl -s http://localhost:8000/api/patios | jq .success
- Explicación: "La consulta a la base de datos respondió 'true' sin interrupción vía la réplica activa."
"""
    t_demo = Table([[Preformatted(demo_steps, code_style)]], colWidths=[504])
    t_demo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93c5fd')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(t_demo)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] PDF generado con éxito: {filename}")

if __name__ == '__main__':
    build_pdf()

