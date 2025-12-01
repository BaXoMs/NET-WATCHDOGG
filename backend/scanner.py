import nmap
import socket
from database import upsert_device

# Función auxiliar para obtener tu IP local actual
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No se conecta realmente, solo ve qué interfaz usa para salir a internet
        s.connect(('8.8.8.8', 80))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def scan_network(network_range=None):
    # Si no nos dan un rango, lo calculamos automáticamente
    if network_range is None:
        local_ip = get_local_ip()
        # Asumimos una máscara estándar /24 (toma los primeros 3 octetos)
        # Ejemplo: si IP es 10.254.232.124 -> base es 10.254.232 -> rango 10.254.232.0/24
        base_ip = ".".join(local_ip.split('.')[:3]) + ".0/24"
        network_range = base_ip
        print(f"Detectada red dinámica: {network_range} (Tu IP: {local_ip})")

    nm = nmap.PortScanner()
    print(f"Escaneando red: {network_range}...")
    
    # Escaneo rápido (-sn: Ping Scan)
    nm.scan(hosts=network_range, arguments='-sn')
    
    found_devices = []
    
    for host in nm.all_hosts():
        if 'mac' in nm[host]['addresses']:
            mac = nm[host]['addresses']['mac']
            ip = nm[host]['addresses']['ipv4']
            vendor = nm[host]['vendor'].get(mac, "Unknown")
            hostname = nm[host].hostname() if nm[host].hostname() else "Unknown"
            
            # Guardar en DB
            upsert_device(mac, ip, hostname, vendor)
            
            device_info = {
                "ip": ip,
                "mac": mac,
                "vendor": vendor,
                "hostname": hostname
            }
            found_devices.append(device_info)
            
    return found_devices