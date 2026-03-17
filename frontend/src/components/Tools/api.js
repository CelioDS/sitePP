// src/services/api.js  (ou onde preferir)
import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  timeout: 15000, // opcional, mas bom ter
});

// Request interceptor (opcional por enquanto, mas útil no futuro)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("Token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor ← aqui está a mágica
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido/expirado → logout automático
      sessionStorage.removeItem("Token");
      sessionStorage.removeItem("login");
      sessionStorage.removeItem("permission");

      toast.error("Sessão expirada. Faça login novamente.");

      // Redireciona para login
      // Opção 1: window.location (mais garantida em SPA)
      window.location.href = "/login"; // ajuste para sua rota de login

      // Opção 2: se estiver usando react-router-dom v6+
      // const navigate = useNavigate();  ← não funciona direto aqui, use history ou context
    }

    return Promise.reject(error);
  }
);

export default api;