from flask import Flask, jsonify, request
from flask_cors import CORS
from database import init_db, get_all_devices, set_device_trust, get_alerts
from scanner import scan_network

app = Flask(__name__)
CORS(app)

# Inicializar DB al arrancar
init_db()

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok", "message": "Net-Watchdogg Backend running!"})

# --- ENDPOINTS OFICIALES (FASE 3) ---

# 1. VER DISPOSITIVOS (No escanea, solo muestra lo guardado)
@app.route('/devices', methods=['GET'])
def list_devices():
    return jsonify(get_all_devices())

# 2. ESCANEAR AHORA (Busca nuevos dispositivos en la red actual)
@app.route('/scan', methods=['POST'])
def run_scan():
    # Ya no ponemos la IP hardcoded. La función la detecta sola.
    scan_network() 
    return jsonify(get_all_devices())

# 3. AGREGAR A WHITELIST (Confiar)
@app.route('/whitelist', methods=['POST'])
def add_whitelist():
    data = request.json
    mac = data.get('mac')
    if not mac:
        return jsonify({"error": "Falta la dirección MAC"}), 400
    
    set_device_trust(mac, True)
    return jsonify({"status": "success", "message": f"Dispositivo {mac} marcado como confiable."})

# 4. ELIMINAR DE WHITELIST (Desconfiar)
# Esto responde a tu duda: así es como "quitamos" a alguien de la lista segura.
# Al hacerlo, volverá a aparecer como "Alerta" si se conecta.
@app.route('/whitelist/<path:mac>', methods=['DELETE'])
def remove_whitelist(mac):
    set_device_trust(mac, False)
    return jsonify({"status": "success", "message": f"Dispositivo {mac} removido de whitelist (ya no es confiable)."})

# 5. VER ALERTAS (Solo los intrusos)
@app.route('/alerts', methods=['GET'])
def list_alerts():
    alerts = get_alerts()
    return jsonify({
        "alert_count": len(alerts),
        "alerts": alerts
    })

if __name__ == '__main__':
    # host='0.0.0.0' permite que tu celular vea al servidor si están en la misma red
    app.run(debug=True, port=8000, host='0.0.0.0')