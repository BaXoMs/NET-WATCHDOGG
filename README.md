# Fireman Discovery RA

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

Fireman Discovery RA una herramienta de diagnóstico de infraestructuras para operaciones a gran escala. Esta aplicación está diseñada para proporcionar a los técnicos de campo una visión unificada y en tiempo real del estado de cualquier activo físico en nuestros centros de datos, utilizando Realidad Aumentada.

Este repositorio contiene el código fuente de la aplicación cliente, desarrollada con React.

## Características del Prototipo ss

Interfaz para simular el escaneo de un código QR introduciendo su identificador.

Comunicación con el backend Fireman Discovery para obtener datos consolidados.

Visualización clara y estructurada de la información del activo:

Información física (origen, destino).

Datos de monitoreo (estado, métricas, alertas).

Perfil de red (SO, puertos abiertos).

Análisis de seguridad.

Funcionalidad para solicitar un "enriquecimiento de datos" bajo demanda (análisis forense). (No imolementada aun)

## Get started

Node.js y npm: Asegúrate de tener instalada una versión reciente de Node.js (LTS recomendada).

1. Install dependencies
2. Backend en ejecución: El backend de FastAPI debe estar en ejecución, ya que esta aplicación realiza llamadas a su API (por defecto, en http://127.0.0.1:8000).

## Intalacion y ejecución

1. Instalar dependencias

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
