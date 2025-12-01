Sistema de Ciberseguridad Activa con Realidad Aumentada y Visualización 3D

NET-WATCHDOGG es una herramienta de auditoría de red diseñada para monitorear, detectar y visualizar dispositivos en una red local (LAN) utilizando una interfaz futurista basada en Realidad Aumentada (AR).

El sistema permite identificar intrusos, recibir alertas hápticas (vibración) en tiempo real y gestionar una lista de confianza (Whitelist), todo mientras se visualiza la topología de la red flotando sobre el entorno real del usuario.

📸 Interfaz HUD / Realidad Aumentada

El sistema superpone la topología de red sobre la visión real de la cámara.

(AQUÍ PEGA LA FOTO QUE ME MANDASTE DE LA APP CON EL FONDO DE TU TECLADO)
Visualización de nodos 3D y tarjetas de información sobre el entorno real.

🚀 Funcionalidades Clave
🛡️ Seguridad Activa

Escaneo de Red: Detección de dispositivos mediante barridos ARP/Ping usando Nmap.

Alertas Inmediatas: El dispositivo móvil vibra y alerta visualmente al detectar una IP/MAC no autorizada.

Gestión de Whitelist: Clasificación de dispositivos en "Confiables" (Verde) o "Intrusos" (Rojo) con un solo toque.

👓 Experiencia de Usuario (UX)

Realidad Aumentada (AR): Uso de Expo Camera para fondos en vivo.

Visualización 3D: Renderizado de nodos interactivos usando Three.js.

Glassmorphism: Tarjetas flotantes semitransparentes estilo HUD militar.

🛠️ Stack Tecnológico
Componente Tecnología Descripción
Backend Python (Flask) API REST, SQLite, control de Nmap.
Escáner Nmap + Scapy Detección de dispositivos y MAC.
Frontend React Native Aplicación móvil (Android/iOS).
Gráficos Three.js Renderizado 3D en WebView.
Conexión Axios + Ngrok Comunicación Cliente-Servidor.
📦 Guía de Instalación
✔️ Prerrequisitos

Python 3.8+

Node.js & NPM

Nmap instalado

🧠 Paso 1: Configurar el Backend (Cerebro)

Entra a la carpeta del servidor:

cd backend

Instala las librerías necesarias:

pip install -r requirements.txt

Inicia el servidor:

python app.py

El servidor escuchará en el puerto 8000.

📱 Paso 2: Configurar la App Móvil (Cliente)

Abre una nueva terminal y entra a la carpeta:

cd mobile-app

Instala dependencias:

npm install

Configura la IP local en mobile-app/config.js:

export const API_URL = 'http://TU_IP_LOCAL:8000';

Ejecuta la app en modo túnel:

npx expo start --tunnel -c

Escanea el QR con Expo Go.

🔌 API Reference
Método Endpoint Acción
GET /devices Obtiene el historial de dispositivos detectados.
POST /scan Ejecuta un escaneo ARP en tiempo real.
POST /whitelist Autoriza un dispositivo (Trusted = True).
DELETE /whitelist/<mac> Revoca acceso (Trusted = False).
