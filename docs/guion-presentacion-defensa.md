# Guion Oficial Diapositiva por Diapositiva para la Defensa del Proyecto
## Sistema de Información Geográfica (SIG) - Cementerio General de Los Ángeles
**Licitación Mercado Público:** 2411-8-LE25  
**Asignatura:** Administración de Redes y Sistemas Computacionales  
**Profesor Evaluador:** Ricardo Pérez  
**Expositores:** Bryan Ahumada (Estudiante 1) & Johan Muñoz (Estudiante 2)  
**Duración Total:** 15 a 20 Minutos  

---

## DIAPOSITIVA 1: Portada y Presentación
* **Elementos Visuales:**
  * Logotipo de la Universidad de Talca.
  * Título: *Sistema de Información Geográfica y Catastro Digital para el Cementerio General de Los Ángeles*.
  * Subtítulo: *Infraestructura de Alta Disponibilidad basada en Contenedores y Microservicio de IA*.
  * Licitación Mercado Público ID: 2411-8-LE25.
  * Nombres de los integrantes y del profesor.
* **Quién expone:** Estudiante 1 (Bryan)

> **🗣️ Qué decir:**  
> *"Buenos días, profesor Ricardo Pérez y presentes. Hoy junto a mi compañero Johan Muñoz presentaremos la defensa de nuestro proyecto integrador para las Unidades 1 y 2 de Administración de Redes y Sistemas. Nuestro proyecto responde a una licitación pública real del portal Mercado Público, orientada al desarrollo, despliegue y puesta en marcha de un Sistema de Información Geográfica y plataforma catastral para el Cementerio General de la comuna de Los Ángeles. A lo largo de esta presentación demostraremos cómo evolucionamos una arquitectura de 6 máquinas virtuales hacia un clúster de 11 microservicios en alta disponibilidad con Docker, incorporando biometría facial inteligente, tolerancia a fallos en caliente y observabilidad continua."*

---

## DIAPOSITIVA 2: El Problema Público y la Licitación Mercado Público
* **Elementos Visuales:**
  * Cuadro con ID de Licitación `2411-8-LE25` (Ilustre Municipalidad de Los Ángeles).
  * 4 iconos del problema: 
    1. Libros físicos en papel deteriorados por la humedad y el paso de más de un siglo.
    2. Recinto de más de 10 hectáreas sin georreferenciación digital.
    3. Más de 40 mausoleos históricos de familias fundadoras sin registro fotográfico ni reseñas patrimoniales.
    4. Trámites presenciales lentos para los ciudadanos que buscan a sus deudos.
* **Quién expone:** Estudiante 2 (Johan)

> **🗣️ Qué decir:**  
> *"Para fundamentar este proyecto seleccionamos la licitación ID 2411-8-LE25 de la Municipalidad de Los Ángeles. El Cementerio General de la comuna data de mediados del siglo XIX y posee una superficie superior a 10 hectáreas. Históricamente, la administración municipal enfrentaba la pérdida y deterioro irreversible de libros parroquiales y laicos centenarios. Además, los ciudadanos debían acudir en persona para consultar registros, y las familias o turistas no tenían cómo localizar espacialmente una sepultura o conocer la historia de los mausoleos patrimoniales. Nuestra solución digitaliza este patrimonio mediante un visor cartográfico interactivo, abierto a la ciudadanía y protegido para la gestión municipal."*

---

## DIAPOSITIVA 3: Evolución de Infraestructura (De 6 VMs a 11 Contenedores)
* **Elementos Visuales:**
  * Tabla comparativa directa U1 vs U2:
    * `VM-1 (vm-web-haproxy)` $\to$ `sig_gateway` (HAProxy L7 en puerto 8000).
    * `VM-2` y `VM-3` (Nginx + Flask) $\to$ `frontend_1`, `frontend_2`, `backend_1`, `backend_2`.
    * `VM-4 (vm-db-haproxy)` $\to$ `sig_haproxy_db` (HAProxy TCP L4 en 5000/5001).
    * `VM-5` y `VM-6` (PostgreSQL Master/Standby) $\to$ `sig_db_primary` y `sig_db_replica` (PostGIS 3.4).
    * *Novedad U2:* `sig_ai_service` (Microservicio de Biometría Facial), `sig_prometheus` y `sig_grafana`.
* **Quién expone:** Estudiante 1 (Bryan)

> **🗣️ Qué decir:**  
> *"Un aspecto medular exigido en la pauta es que la Unidad 2 no fuera un proyecto aislado, sino la evolución directa de lo construido en la Unidad 1. En la primera unidad operamos 6 máquinas virtuales sobre Debian 13 en Google Cloud Platform conectadas por VPC Peering. En esta segunda unidad, paquetizamos cada responsabilidad en contenedores inmutables: el balanceador web pasó a ser `sig_gateway`, desacoplamos el frontend en React bajo Nginx sin privilegios, separamos la API en Flask replicada, mantuvimos el balanceo TCP de base de datos con `sig_haproxy_db`, e incorporamos tres componentes clave: un microservicio independiente de Inteligencia Artificial para autenticación biométrica, y la pila de observabilidad compuesta por Prometheus y Grafana. Todo este clúster de 11 nodos consume menos de 820 MB de memoria RAM."*

---

## DIAPOSITIVA 4: Diagrama de la Nueva Arquitectura en Contenedores
* **Elementos Visuales:**
  * Diagrama oficial de arquitectura (imagen exportada `diagrama_arquitectura_u2.png`).
  * Destacar el flujo vertical: Redundancia Física $\to$ Gateway L7 $\to$ Nodos Replicados + IA $\to$ Balanceador DB TCP $\to$ Persistencia PostGIS Aislada $\to$ Monitoreo y Respaldos.
* **Quién expone:** Estudiante 2 (Johan)

> **🗣️ Qué decir:**  
> *"En pantalla observamos la arquitectura integral de la Unidad 2. En la parte superior consideramos la redundancia física de energía mediante UPS y generador diésel, junto a doble enlace de fibra óptica. El usuario ingresa por un único punto de entrada: el contenedor `sig_gateway` en el puerto 8000. Este gateway analiza la URL mediante reglas ACL: el tráfico web estático se distribuye entre los dos servidores frontend en React; las peticiones REST catastrales se enrutan a los backends en Flask; y las solicitudes biométricas viajan al microservicio de IA. En la parte inferior, los backends se comunican con el balanceador TCP de base de datos, el cual gestiona la persistencia hacia PostGIS primario y réplica en una red totalmente aislada de internet. En paralelo, Prometheus raspa métricas cada 10 segundos y Grafana ofrece dashboards en tiempo real."*

---

## DIAPOSITIVA 5: Capa de Entrada (Ingress L7), Frontend y Backend Replicado
* **Elementos Visuales:**
  * Diagrama de flujo de `sig_gateway` con ACLs: `path_beg /api/ai/`, `path_beg /api/`, `default_backend web_cluster`.
  * Frontend: React 18 SPA + Vite, servido en Nginx no-root (UID 101, puerto 8080).
  * Backend: Flask + Gunicorn (3 workers por nodo, UID 10001, puerto 5000).
* **Quién expone:** Estudiante 1 (Bryan)

> **🗣️ Qué decir:**  
> *"Profundizando en las primeras capas, `sig_gateway` opera bajo HAProxy 2.8. No utilizamos un DNS simple porque necesitábamos enrutamiento por ruta de Capa 7 y health checks activos que revisan el endpoint `/api/health` cada 3 segundos. Si un backend falla, HAProxy lo retira en 9 segundos y reintenta la solicitud en el nodo sano de forma transparente. En la capa web, construimos imágenes multi-stage que compilan con Node 20 y se ejecutan sobre Nginx unprivileged sin permisos de root. Los dos nodos de backend corren Flask con Gunicorn de 3 workers bajo el usuario `appuser`, garantizando alta concurrencia y tolerancia a fallos."*

---

## DIAPOSITIVA 6: El Microservicio de Inteligencia Artificial (Reconocimiento Facial)
* **Elementos Visuales:**
  * Diagrama del pipeline matemático: Detección Haar-Cascade $\to$ Recorte $128 \times 128$ $\to$ Ecualización Histograma $\to$ Descriptores espaciales $8 \times 8$ + Gradientes Sobel $\to$ Normalización L2 $\to$ Correlación de Pearson ($r \ge 0.75$).
  * Captura de la cámara WebRTC en vivo con visor ovalado.
* **Quién expone:** Estudiante 2 (Johan)

> **🗣️ Qué decir:**  
> *"Para cumplir con el requerimiento de IA pertinente a la licitación, desarrollamos un microservicio dedicado en el contenedor `sig_ai_service`. En cementerios municipales, los funcionarios de catastro en terreno suelen compartir claves o extraviar credenciales. Implementamos autenticación biométrica facial soberana y local: la cámara WebRTC captura el rostro del funcionario, el motor aplica Haar-Cascade para detección y recorte, ecualiza el histograma para neutralizar variaciones de luz, y extrae una firma de 128 valores combinando cuadrículas espaciales y gradientes de Sobel para capturar rasgos de ojos, nariz y labios. Al comparar contra los perfiles enrolados mediante correlación de Pearson, si la similitud supera el 75%, el sistema genera el token JWT y autentica al usuario. Los perfiles persisten en el volumen desacoplado `sig_ai_data`, cumpliendo con la Ley 19.628 de protección de datos al no enviar información biométrica a nubes extranjeras."*

---

## DIAPOSITIVA 7: Balanceo TCP y Persistencia Espacial con PostGIS
* **Elementos Visuales:**
  * Esquema de `sig_haproxy_db` con Puerto 5000 (Escritura) y Puerto 5001 (Lectura).
  * Base de datos: `sig_db_primary` y `sig_db_replica` (PostgreSQL 16 + PostGIS 3.4).
  * Explicación de la red interna: `sig_db_network` con flag `internal: true`.
* **Quién expone:** Estudiante 1 (Bryan)

> **🗣️ Qué decir:**  
> *"En la capa de datos resolvemos un problema clásico de los sistemas distribuidos. PostgreSQL opera con replicación primaria y secundaria en streaming: solo el primario puede escribir datos. Si hubiésemos usado balanceo DNS estándar de Docker, el 50% de las escrituras habrían caído en la réplica de solo lectura, provocando errores catastróficos. Por ello implementamos `sig_haproxy_db`, que canaliza transacciones de escritura al puerto 5000 apuntando exclusivamente al primario, con conmutación por error automática hacia la réplica si el primario se desconecta. Para consultas pesadas de lectura, expone el puerto 5001 balanceado. Además, ambas bases de datos residen en la red Docker `sig_db_network` configurada con `internal: true`, lo que significa que están totalmente aisladas del exterior y no tienen puertos expuestos al host."*

---

## DIAPOSITIVA 8: Seguridad, Buenas Prácticas y Políticas Non-Root
* **Elementos Visuales:**
  * Cuadro comparativo de usuarios de los contenedores (UID 101, UID 10001).
  * Captura de `.env.example` limpio en el repositorio y `.env` en `.gitignore`.
  * Etiquetas específicas de Docker: cero `:latest`.
* **Quién expone:** Estudiante 2 (Johan)

> **🗣️ Qué decir:**  
> *"La seguridad fue implementada bajo las mejores prácticas de la industria y la pauta de evaluación. Ningún contenedor de aplicación corre como root: el frontend corre con UID 101 (usuario nginx) y el backend e IA corren con UID 10001 (appuser), previniendo ataques de escalamiento o container breakout. En el repositorio de Git no existen contraseñas reales ni claves API en texto plano; todo se parametriza a través de variables de entorno inyectadas en tiempo de ejecución. Asimismo, prohibimos el uso de la etiqueta `:latest`, congelando versiones específicas en cada Dockerfile para garantizar reproducibilidad exacta y cero incompatibilidades futuras."*

---

## DIAPOSITIVA 9: Monitoreo, Telemetría y Observabilidad
* **Elementos Visuales:**
  * Captura de Prometheus en `:9090` mostrando los 6 targets activos en verde `UP`.
  * Captura del dashboard de Grafana en `:3000` con indicadores de estado, gráfica de latencia y métricas de IA (`ai_facial_recognitions_total`, `ai_enrolled_users_count`).
* **Quién expone:** Estudiante 1 (Bryan)

> **🗣️ Qué decir:**  
> *"Para el aspecto de monitoreo exigido en la rúbrica integramos la dupla Prometheus y Grafana. Prometheus raspa cada 10 segundos métricas de 6 objetivos: el gateway web, los dos nodos de API, el microservicio de IA, el balanceador de base de datos y su propio motor. En Grafana aprovisionamos un dashboard completo que permite diagnosticar el estado del clúster en tiempo real, latencias de scraping y el comportamiento del motor biométrico. Aunque HAProxy tiene pantallas de estadísticas útiles en los puertos 8404 y 7070, Grafana aporta la retención histórica de series temporales y visualización ejecutiva indispensable para la administración de sistemas."*

---

## DIAPOSITIVA 10: Continuidad Operacional, Respaldo y Recuperación ante Desastres
* **Elementos Visuales:**
  * Flujo de scripts: `backup.sh` $\to$ volcado `cementerio_db_*.sql.gz` $\to$ `restore.sh`.
  * Script `02-cemetery-seed.sql` para inicialización automática en nuevos despliegues.
  * Plan de pruebas de Failover en vivo: detener backend 1 y base de datos primaria sin interrumpir el servicio.
* **Quién expone:** Estudiante 2 (Johan)

> **🗣️ Qué decir:**  
> *"Para garantizar la continuidad de negocio y la recuperación ante desastres que exige el Aspecto 4 de la pauta, desarrollamos herramientas automatizadas. Nuestro script `backup.sh` genera volcados en caliente de PostGIS comprimidos en gzip con estampas de tiempo. El script `restore.sh` automatiza la restauración ante pérdidas masivas de datos y ejecuta una auditoría de conteo de registros en vivo. Adicionalmente, creamos el script `02-cemetery-seed.sql` dentro de `/docker-entrypoint-initdb.d/`, lo que permite que cualquier miembro del equipo o el profesor pueda clonar el repositorio, ejecutar `docker compose up -d` y tener la base de datos poblada de inmediato al 100% de manera idéntica."*

---

## DIAPOSITIVA 11: Demostración Funcional en Vivo (El Tour de la Plataforma)
* **Elementos Visuales:**
  * Pestaña del navegador con [`http://localhost:8000`](http://localhost:8000).
  * Mapa satelital interactivo con los 5 patios poligonales y 50 sepulturas coloreadas por estado.
  * Tarjetas de los 7 mausoleos históricos con sus fotos reales de alta resolución.
  * Demostración del Login Facial mediante la cámara web.
  * Prueba de tolerancia a fallos: `docker stop sig_backend_1` en vivo mostrando que la web sigue respondiendo.
* **Quién expone:** Ambos estudiantes (Bryan demuestra en pantalla y Johan explica la conmutación técnica)

> **🗣️ Qué decir (Bryan):**  
> *"A continuación pasaremos a la demostración práctica en vivo. En el puerto 8000 vemos la plataforma pública cargando el mapa satelital de Los Ángeles con los 5 patios poligonales y las 50 sepulturas distribuidas. En la sección de Mausoleos observamos las 7 fichas patrimoniales con fotografías reales y reseñas históricas. Ahora cerraremos sesión y demostraremos el inicio de sesión biométrico: activo la cámara web, enfoco el rostro en el óvalo, y el microservicio me autentica automáticamente como Administrador con un 94% de confianza."*  
>   
> **🗣️ Qué decir (Johan):**  
> *"Ahora demostraremos la resiliencia en caliente. En la terminal detendré deliberadamente el nodo principal de API: `docker stop sig_backend_1`. Como se aprecia en el panel de HAProxy, el nodo pasa a rojo inmediatamente; sin embargo, al volver a la página web y realizar una búsqueda de sepultura, la plataforma responde de inmediato sin errores 500, ya que el tráfico fue asumido al 100% por backend 2."*

---

## DIAPOSITIVA 12: Presupuesto Económico y Conclusiones
* **Elementos Visuales:**
  * Tabla resumen del presupuesto de la licitación:
    * Costos de desarrollo y arquitectura (Ingeniería de software).
    * Costos de infraestructura mensual (Servidores cloud o cómputo municipal).
    * Mantención, soporte y respaldo anual.
    * Ahorro significativo: Costo cero en licencias de software privativo (100% Open Source).
  * Conclusiones finales y cierre.
* **Quién expone:** Estudiante 1 (Bryan)

> **🗣️ Qué decir:**  
> *"Para finalizar, nuestro análisis económico para la licitación demuestra la viabilidad del proyecto. Al basar la solución enteramente en software de código abierto (PostGIS, Python, React, HAProxy, OpenCV y Prometheus), el municipio ahorra sumas millonarias en licencias privativas como ArcGIS u Oracle, destinando el presupuesto a infraestructura de alta disponibilidad y soporte continuo. En conclusión, hemos entregado un sistema robusto, modular, altamente disponible y con inteligencia artificial aplicada que resuelve un problema de valor público real para la ciudad de Los Ángeles. Quedamos atentos a sus preguntas y observaciones. Muchas gracias."*

---
