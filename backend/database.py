import sqlite3

DB_NAME = "net_watchdogg.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Para acceder a columnas por nombre
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Tabla principal devices (MAC, IP, nombre, trusted)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            mac TEXT PRIMARY KEY,
            ip TEXT,
            hostname TEXT,
            vendor TEXT,
            trusted INTEGER DEFAULT 0,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Base de datos verificada/inicializada.")

def upsert_device(mac, ip, hostname, vendor):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Insertar o actualizar si ya existe (upsert)
    cursor.execute('''
        INSERT INTO devices (mac, ip, hostname, vendor, last_seen)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(mac) DO UPDATE SET
            ip=excluded.ip,
            hostname=excluded.hostname,
            last_seen=CURRENT_TIMESTAMP
    ''', (mac, ip, hostname, vendor))
    conn.commit()
    conn.close()

# --- NUEVAS FUNCIONES PARA FASE 3 ---

def get_all_devices():
    conn = get_db_connection()
    devices = conn.execute('SELECT * FROM devices').fetchall()
    conn.close()
    # Convertir objetos Row a diccionarios
    return [dict(dev) for dev in devices]

def set_device_trust(mac, is_trusted):
    conn = get_db_connection()
    val = 1 if is_trusted else 0
    conn.execute('UPDATE devices SET trusted = ? WHERE mac = ?', (val, mac))
    conn.commit()
    conn.close()

def get_alerts():
    conn = get_db_connection()
    # Una "alerta" es cualquier dispositivo NO confiable (trusted=0)
    alerts = conn.execute('SELECT * FROM devices WHERE trusted = 0').fetchall()
    conn.close()
    return [dict(a) for a in alerts]