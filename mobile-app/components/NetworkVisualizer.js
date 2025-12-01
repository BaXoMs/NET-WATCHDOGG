import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

export default function NetworkVisualizer({ devices, onNodeClick }) {
  // Convertimos los datos a string para pasarlos al HTML
  const devicesJson = JSON.stringify(devices);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style> body { margin: 0; overflow: hidden; background-color: transparent; } </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      </head>
      <body>
        <script>
          const devices = ${devicesJson};
          
          // --- CONFIGURACIÓN ESCENA ---
          const scene = new THREE.Scene();
          
          // Renderer con transparencia (alpha: true) para el efecto Glassmorphism
          const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setClearColor(0x000000, 0); // Fondo transparente
          document.body.appendChild(renderer.domElement);

          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 12;
          camera.position.y = 6;

          // Luces
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
          scene.add(ambientLight);
          const pointLight = new THREE.PointLight(0xffffff, 1);
          pointLight.position.set(10, 10, 10);
          scene.add(pointLight);

          // Array para guardar objetos interactivos
          const interactiveObjects = [];

          // --- 1. EL ROUTER (NODO CENTRAL) ---
          // Usamos un Icosaedro wireframe para look Cyberpunk
          const routerGeo = new THREE.IcosahedronGeometry(1.5, 0);
          const routerMat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff, // Cyan
            emissive: 0x004444,
            wireframe: true,
            transparent: true, 
            opacity: 0.9 
          });
          const router = new THREE.Mesh(routerGeo, routerMat);
          scene.add(router);

          // --- 2. DISPOSITIVOS (NODOS SATÉLITE) ---
          const radius = 6.5; // Radio de expansión un poco más amplio
          
          devices.forEach((device, index) => {
            const angle = (index / devices.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Color: Verde (Confiable) o Rojo (Intruso)
            const color = device.trusted ? 0x00ff00 : 0xff0000;
            
            // Forma: Octaedro (Diamante de datos)
            const nodeGeo = new THREE.OctahedronGeometry(0.7, 0);
            const nodeMat = new THREE.MeshPhongMaterial({ 
              color: color,
              emissive: device.trusted ? 0x004400 : 0x440000,
              flatShading: true
            });
            
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.set(x, 0, z);
            
            // Guardamos la MAC dentro del objeto 3D para identificarlo al hacer clic
            node.userData = { mac: device.mac };
            
            scene.add(node);
            interactiveObjects.push(node); // Lo agregamos a la lista de "clickeables"

            // CONEXIONES (LÍNEAS)
            const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ 
              color: 0x888888, 
              transparent: true, 
              opacity: 0.2 
            });
            const line = new THREE.Line(lineGeo, lineMat);
            scene.add(line);
          });

          // --- 3. INTERACTIVIDAD (RAYCASTING) ---
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2();

          function onTouch(event) {
            event.preventDefault();
            
            let clientX, clientY;
            if (event.changedTouches) {
                clientX = event.changedTouches[0].clientX;
                clientY = event.changedTouches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }

            // Normalizar coordenadas (-1 a +1)
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            // Detectar intersecciones solo con los nodos (no con líneas ni router)
            const intersects = raycaster.intersectObjects(interactiveObjects);

            if (intersects.length > 0) {
              const selectedNode = intersects[0].object;
              
              // Pequeña animación al tocar
              selectedNode.scale.set(1.5, 1.5, 1.5);
              setTimeout(() => selectedNode.scale.set(1, 1, 1), 300);

              // ENVIAR MENSAJE A REACT NATIVE
              if(window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(selectedNode.userData));
              }
            }
          }

          window.addEventListener('touchstart', onTouch, { passive: false });
          window.addEventListener('click', onTouch); 

          // --- ANIMACIÓN ---
          function animate() {
            requestAnimationFrame(animate);
            
            router.rotation.x += 0.005;
            router.rotation.y += 0.01;

            // Rotación orbital de la cámara
            const time = Date.now() * 0.0001; 
            camera.position.x = Math.cos(time) * 14;
            camera.position.z = Math.sin(time) * 14;
            camera.lookAt(0, 0, 0);

            // Rotación individual de nodos
            interactiveObjects.forEach(obj => {
                obj.rotation.y += 0.02;
            });

            renderer.render(scene, camera);
          }
          animate();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        // Este prop es vital: recibe el mensaje del HTML y ejecuta la función de App.js
        onMessage={(event) => {
            if (onNodeClick) {
                try {
                    const data = JSON.parse(event.nativeEvent.data);
                    onNodeClick(data);
                } catch(e) { console.log("Error 3D click"); }
            }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Eliminamos el background negro fijo para permitir transparencia
    backgroundColor: 'transparent', 
  },
  webview: {
    backgroundColor: 'transparent',
  }
});