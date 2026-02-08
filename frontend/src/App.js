import "./App.css";
import { Outlet } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import Footer from "./components/Layout/Footer";
import NavBar from "./components/Layout/NavBar";
import Login from "./components/Layout/Login";
import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [permission, setPermission] = useState(
    localStorage.getItem("permission") === "true"
  );

  const [loginBD, setLoginBD] = useState();

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
      <NavBar setPermission={setPermission} permission={permission} loginBD={loginBD} />
      {permission && <Outlet context={{ loginBD }} />}
      {!permission && (
        <Login
          permission={permission}
          setPermission={setPermission}
          setLoginBD={setLoginBD}
        />
      )}
      <ToastContainer
        pauseHouver={false}
        autoClose={1000}
        position="bottom-right"
        limit={2}
        closeOnClick={true}
        draggable={true}
        draggablePercent={1}
        theme="dark"
      />
      <Footer />
    </div>
  );
}

export default App;
