import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 segundos de espera máx (el escaneo tarda)
});

export const getDevices = async () => {
  try {
    console.log("Consultando dispositivos...");
    const response = await api.get('/devices');
    return response.data;
  } catch (error) {
    console.error("Error al obtener dispositivos:", error);
    return []; // Retorna lista vacía si falla para que no truene la app
  }
};

export const scanNetwork = async () => {
  try {
    console.log("Iniciando escaneo remoto...");
    const response = await api.post('/scan');
    return response.data;
  } catch (error) {
    console.error("Error al escanear:", error);
    throw error;
  }
};

export const addToWhitelist = async (mac) => {
  try {
    await api.post('/whitelist', { mac });
    return true;
  } catch (error) {
    console.error("Error whitelist:", error);
    return false;
  }
};

export const removeFromWhitelist = async (mac) => {
  try {
    await api.delete(`/whitelist/${mac}`);
    return true;
  } catch (error) {
    console.error("Error removing whitelist:", error);
    return false;
  }
};