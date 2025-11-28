import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Server, AlertTriangle, CheckCircle, BarChart2, Clock, ChevronRight, Cable, QrCode, Cog, ShieldCheck, X } from 'lucide-react-native';

// CONFIGURACIÓN 
const API_BASE_URL = 'http://:8000';  //IP de la compu 
const POLLING_INTERVAL_MS = 5000; // Consultar cada 5 segundos

// Componente Principal 
const App = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedData, setScannedData] = useState(null);
    const [assetData, setAssetData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Usamos useRef para el intervalo para que no se reinicie en cada render
    const intervalRef = useRef(null);

    // LÓGICA DE DATOS
    const handleFetchData = async (qrId, isRefresh = false) => {
        if (!isRefresh) {
            setIsLoading(true);
            setAssetData(null);
        }
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/asset/${qrId}`);
            if (!response.ok) {
                throw new Error((await response.json()).detail || `Error: ${response.status}`);
            }
            const data = await response.json();
            setAssetData(data); // Actualiza los datos
        } catch (err) {
             setError(err.message.includes('Network') 
                ? 'No se pudo conectar al servidor. Verifica la IP y la red.'
                : err.message
            );
            // Si hay un error, detenemos las actualizaciones
            if (intervalRef.current) clearInterval(intervalRef.current);
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    };
    
    // EFECTOS 
    useEffect(() => {
        // Pide permiso al inicio
        if (!permission?.granted) {
            requestPermission();
        }
        // Limpia el intervalo cuando el componente se desmonta
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [permission]);
    
    const handleBarCodeScanned = ({ data }) => {
        if (!isLoading && !assetData) { 
            setScannedData(data);
            handleFetchData(data);
            
            // Inicia el polling
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                console.log(`Actualizando datos para ${data}...`);
                handleFetchData(data, true); // `true` para que sea una actualización silenciosa
            }, POLLING_INTERVAL_MS);
        }
    };

    const resetState = () => {
        // Detiene el polling al cerrar la vista
        if (intervalRef.current) clearInterval(intervalRef.current);
        setScannedData(null);
        setAssetData(null);
        setError(null);
        setIsLoading(false);
    };

    // RENDERIZADO 
    if (!permission?.granted) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.permissionText}>Se necesita permiso para usar la cámara.</Text>
                <TouchableOpacity style={styles.scanButton} onPress={requestPermission}>
                    <Text style={styles.scanButtonText}>Conceder Permiso</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <CameraView
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.overlayContainer}>
                { !assetData && !isLoading && !error &&
                    <View style={styles.promptContainer}>
                        <QrCode color="rgba(255,255,255,0.8)" size={48}/>
                        <Text style={styles.scannerText}>Buscando un código QR...</Text>
                    </View>
                }
                {isLoading && <ActivityIndicator size="large" color="#ffffff" />}
                {error && 
                    <View style={styles.arCard}>
                        <Message type="error" title="Error" message={error} />
                        <TouchableOpacity style={styles.resetButton} onPress={resetState}>
                            <Text style={styles.resetButtonText}>Escanear de Nuevo</Text>
                        </TouchableOpacity>
                    </View>
                }
                {assetData && <AssetOverlay data={assetData} onClose={resetState} />}
            </View>
        </View>
    );
};

// Componentes 
const AssetOverlay = ({ data, onClose }) => (
    <SafeAreaView style={styles.hudContainer} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
            <InfoCard icon={<Server size={20} color="#818cf8" />} title="Información del Activo">
                <DataRow label="QR ID" value={data.asset_info.qr_id} />
                <View style={styles.connectionContainer}>
                    <View style={styles.connectionEndpoint}><Text style={styles.connectionLabel}>Origen</Text><Text style={styles.monoText}>{data.asset_info.source.device_name}/{data.asset_info.source.port}</Text><Text style={styles.ipText}>{data.asset_info.source.ip}</Text></View>
                    <ChevronRight color="#475569" size={24} />
                    <View style={styles.connectionEndpoint}><Text style={styles.connectionLabel}>Destino</Text><Text style={styles.monoText}>{data.asset_info.destination.device_name}/{data.asset_info.destination.port}</Text></View>
                </View>
            </InfoCard>

            <InfoCard icon={<BarChart2 size={20} color="#34d399" />} title="Datos de Monitoreo" isLive>
                <StatusChip label="Estado Host Origen" status={data.monitoring_data.source_host_status} />
                <StatusChip label="Estado Puerto Destino" status={data.monitoring_data.destination_port_status} />
                <View style={styles.separator} />
                {data.monitoring_data.metrics.map(metric => ( <DataRow key={metric.name} label={metric.name} value={`${metric.value} ${metric.unit}`} /> ))}
                {data.monitoring_data.active_triggers.map((trigger, index) => ( <Alert key={index} priority={trigger.priority} description={trigger.description} /> ))}
            </InfoCard>

            <InfoCard icon={<Cog size={20} color="#f59e0b" />} title="Perfil de Red">
                <DataRow label="Último Escaneo Nmap" value={new Date(data.network_profile.last_nmap_scan).toLocaleString()} />
                <DataRow label="SO Detectado" value={data.network_profile.os_guess} />
                <DataRow label="Puertos Abiertos" value={data.network_profile.open_ports.join(', ')} />
            </InfoCard>

            <InfoCard icon={<ShieldCheck size={20} color="#ef4444" />} title="Análisis de Seguridad">
                <DataRow label="Último Evento Zeek" value={new Date(data.security_analysis.last_zeek_event).toLocaleString()} />
                <DataRow label="Resumen" value={data.security_analysis.summary} />
                {data.security_analysis.notable_events.length === 0 && ( <Text style={styles.noEventsText}>No hay eventos notables.</Text> )}
            </InfoCard>
        </ScrollView>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="#ffffff" size={24}/>
            <Text style={styles.closeButtonText}>Cerrar y Escanear Otro</Text>
        </TouchableOpacity>
    </SafeAreaView>
);

const InfoCard = ({ icon, title, isLive, children }) => (
    <View style={styles.arCard}>
        <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {icon}
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            {isLive && <LiveIndicator />}
        </View>
        {children && <View style={styles.cardContent}>{children}</View>}
    </View>
);

const LiveIndicator = () => (
    <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>EN VIVO</Text>
    </View>
);

const DataRow = ({ label, value }) => (<View style={styles.dataRow}><Text style={styles.dataLabel}>{label}:</Text><Text style={[styles.monoText, styles.dataValue]}>{value}</Text></View>);
const Message = ({ type, title, message }) => (<><View style={{flexDirection: 'row'}}><AlertTriangle color={'#f87171'} size={24} style={{marginRight: 12}} /><View style={{ flex: 1 }}><Text style={[styles.messageTitle, styles.errorText]}>{title}</Text><Text style={styles.errorText}>{message}</Text></View></View></>);
const StatusChip = ({ label, status }) => {
    const isOk = status.toUpperCase() === 'UP' || status.toUpperCase() === 'OK';
    return (<View style={styles.statusRow}><Text style={styles.dataLabel}>{label}:</Text><View style={[styles.chip, isOk ? styles.chipOk : styles.chipProblem]}><Text style={isOk ? styles.chipTextOk : styles.chipTextProblem}>{status}</Text></View></View>);
};
const Alert = ({ priority, description }) => (<View style={styles.alertContainer}><AlertTriangle color="#f59e0b" size={16} style={{marginRight: 8}}/><Text style={styles.alertText}><Text style={{fontWeight: 'bold'}}>{priority}:</Text> {description}</Text></View>);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    centered: { justifyContent: 'center', alignItems: 'center', flex: 1 },
    permissionText: { color: '#ffffff', fontSize: 18, textAlign: 'center', marginBottom: 20 },
    overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    promptContainer: { padding: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, alignItems: 'center', gap: 10 },
    scannerText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    hudContainer: { flex: 1, justifyContent: 'flex-end' },
    arCard: { backgroundColor: 'rgba(30, 41, 59, 0.9)', borderWidth: 1, borderColor: '#475569', borderRadius: 12, marginBottom: 16, padding: 16, alignSelf: 'stretch' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#475569', justifyContent: 'space-between' },
    cardTitle: { color: '#ffffff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    cardContent: { paddingTop: 10, gap: 10 },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dataLabel: { color: '#94a3b8', flex: 1 },
    dataValue: { color: '#ffffff', flex: 1, textAlign: 'right' },
    monoText: { color: '#e2e8f0' },
    ipText: { color: '#818cf8', fontSize: 12 },
    connectionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#475569'},
    connectionEndpoint: { alignItems: 'center', flex: 1 },
    connectionLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
    closeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', paddingVertical: 16, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
    closeButtonText: { color: '#ffffff', fontWeight: 'bold', marginLeft: 12, fontSize: 18 },
    resetButton: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    resetButtonText: { color: '#ffffff', fontWeight: 'bold' },
    messageTitle: { fontWeight: 'bold', marginBottom: 4, color: '#ffffff' },
    errorText: { color: '#f87171' },
    separator: { height: 1, backgroundColor: '#475569', marginVertical: 8 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
    chipOk: { backgroundColor: 'rgba(52, 211, 153, 0.1)' },
    chipProblem: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    chipTextOk: { color: '#34d399', fontWeight: 'bold' },
    chipTextProblem: { color: '#ef4444', fontWeight: 'bold' },
    alertContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 6, marginTop: 4},
    alertText: { color: '#f59e0b', flex: 1 },
    scanButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 8 },
    scanButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    noEventsText: { color: '#64748b', fontStyle: 'italic', paddingTop: 4 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399', marginRight: 6 },
    liveText: { color: '#34d399', fontWeight: 'bold', fontSize: 12 },
});

export default App;

