import "./App.css";
import { Outlet } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import Footer from "./components/Layout/Footer";
import NavBar from "./components/Layout/NavBar";
import Login from "./components/Layout/Login";
import axios from "axios";
import { useState, useEffect } from "react";

function App() {
  const [permission, setPermission] = useState(
    localStorage.getItem("permission") === "true",
  );

  const [loginBD, setLoginBD] = useState();
  const [canalBD, setCanalBD] = useState();
  const [misBD, setMisBD] = useState();

  const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("Token");
    if (token) {
      // Aqui você pode fazer uma requisição ao backend para validar o token
      axios
        .get(`${baseURL}/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => setPermission(true))
        .catch(() => {
          //localStorage.removeItem("Token");
          setPermission(false);
        });
    }
  }, [baseURL]);

  return (
    <div className="App">
      <NavBar
        canalBD={canalBD}
        permission={permission}
        setPermission={setPermission}
        misBD={misBD}
      />
      {permission && <Outlet context={{ loginBD }} />}
      {!permission && (
        <Login
          setLoginBD={setLoginBD}
          setMisBD={setMisBD}
          setCanalBD={setCanalBD}
          permission={permission}
          setPermission={setPermission}
        />
      )}
      <ToastContainer
        limit={2}
        theme="dark"
        autoClose={1000}
        draggable={true}
        pauseHouver={false}
        closeOnClick={true}
        draggablePercent={1}
        position="bottom-right"
      />
      <Footer />
    </div>
  );
}

export default App;
