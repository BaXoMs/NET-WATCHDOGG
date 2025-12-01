import React, { useEffect, useState } from 'react';
// AQUI ESTABA EL ERROR: Ahora todo está en una sola línea
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Alert, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { Ionicons } from '@expo/vector-icons';
import { getDevices, scanNetwork, addToWhitelist, removeFromWhitelist } from './services/api';
import NetworkVisualizer from './components/NetworkVisualizer';

const { width } = Dimensions.get('window');

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- FUNCIONES ---

  const loadDevices = async () => {
    setLoading(true);
    const data = await getDevices();
    setDevices(data);
    setLoading(false);
  };

  const handleScan = async () => {
    setLoading(true);
    try {
      const data = await scanNetwork();
      
      // LÓGICA DE ALERTA DE INTRUSOS (VIBRACIÓN)
      const intruders = data.filter(d => !d.trusted);

      if (intruders.length > 0) {
        // Vibra: espera 0ms, vibra 500ms, espera 200ms, vibra 500ms
        Vibration.vibrate([0, 500, 200, 500]);
        
        Alert.alert(
            "⚠️ ALERTA DE SEGURIDAD", 
            `Se han detectado ${intruders.length} dispositivos no autorizados.`,
            [{ text: "Entendido" }]
        );
      }

      setDevices(data);
    } catch (error) {
      console.log("Error escaneando");
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTrust = async (device) => {
    if (device.trusted) {
      await removeFromWhitelist(device.mac);
    } else {
      await addToWhitelist(device.mac);
    }
    // Actualización optimista para que se sienta rápido
    const updated = devices.map(d => d.mac === device.mac ? {...d, trusted: !d.trusted} : d);
    setDevices(updated);
  };

  const handle3DClick = (nodeData) => {
    if (!nodeData || !nodeData.mac) return;
    const device = devices.find(d => d.mac === nodeData.mac);
    if (device) {
        Alert.alert(
          "Detalle de Nodo", 
          `IP: ${device.ip}\nVendor: ${device.vendor || '?'}\nEstado: ${device.trusted ? 'Seguro' : 'Alerta'}`, 
          [{ text: "OK" }]
        );
    }
  };

  // --- EFECTOS ---
  useEffect(() => {
    loadDevices();
  }, []);

  // --- PERMISOS ---
  if (!permission) {
    return <View style={{flex:1, backgroundColor: '#000'}} />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara para el fondo AR</Text>
        <TouchableOpacity style={styles.scanButton} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>DAR PERMISO DE CÁMARA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDERIZADO DE TARJETA ---
  const renderHudCard = ({ item }) => (
    <View style={styles.hudCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
            <Ionicons name="server-outline" size={16} color="#fbbf24" />
            <Text style={styles.cardTitle}>Información del Activo</Text>
        </View>
        <Text style={styles.macId}>ID: {item.mac ? item.mac.slice(-5) : '???'}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
            <View>
                <Text style={styles.label}>Origen (IP)</Text>
                <Text style={styles.valueHighlight}>{item.ip}</Text>
            </View>
            <Ionicons name="arrow-forward" color="rgba(255,255,255,0.3)" size={16} />
            <View>
                <Text style={styles.label}>Fabricante</Text>
                <Text style={styles.value}>{item.vendor || "Genérico"}</Text>
            </View>
        </View>

        <View style={styles.statusSection}>
            <View style={styles.statusRow}>
                <Text style={styles.label}>Último Escaneo:</Text>
                <Text style={styles.valueSmall}>{item.last_seen || "Reciente"}</Text>
            </View>
            
            <View style={styles.statusRow}>
                <Text style={styles.label}>Confianza:</Text>
                <View style={[styles.badge, { backgroundColor: item.trusted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                    <Text style={{ color: item.trusted ? '#34d399' : '#f87171', fontWeight: 'bold', fontSize: 10 }}>
                        {item.trusted ? '● OK' : '● ALERT'}
                    </Text>
                </View>
            </View>
        </View>

        <TouchableOpacity 
            style={styles.actionLink}
            onPress={() => toggleTrust(item)}
        >
            <Text style={styles.actionLinkText}>
                {item.trusted ? "REVOCAR ACCESO" : "AUTORIZAR DISPOSITIVO"}
            </Text>
            <Ionicons name="chevron-forward" color="#60a5fa" size={14} />
        </TouchableOpacity>

      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* FONDO AR */}
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
      <View style={styles.overlay} />

      {/* LISTA Y VISUALIZADOR */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.mac}
        renderItem={renderHudCard}
        contentContainerStyle={styles.scrollContent}
        
        ListHeaderComponent={
            <View style={styles.headerContainer}>
                <Text style={styles.mainTitle}>NET-WATCHDOGG</Text>
                <View style={{ height: 350, width: '100%' }}>
                    <NetworkVisualizer devices={devices} onNodeClick={handle3DClick} />
                </View>
                <Text style={styles.sectionTitle}>RESULTADOS ({devices.length})</Text>
            </View>
        }
      />

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanButtonText}>ESCANEAR RED</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  scrollContent: {
    paddingBottom: 100, 
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  headerContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  mainTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 255, 0, 0.8)',
    textShadowRadius: 10,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
    letterSpacing: 1,
  },
  hudCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  macId: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  cardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
  },
  valueHighlight: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  statusSection: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueSmall: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionLinkText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});