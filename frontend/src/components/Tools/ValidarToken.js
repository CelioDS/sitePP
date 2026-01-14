import axios from "axios";

export default async function validarToken() {
  try {
    const token = localStorage.getItem("Token");
    if (!token) return null;

    const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

    const res = await axios.get(`${Url}/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data; // ← JÁ É { login, admin, id }
  } catch {
    return null;
  }
}
