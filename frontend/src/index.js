import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import MIS from "./components/Routers/MIS";
import Home from "./components/Routers/Home";
import Error from "./components/Routers/Error";
import Perfil from "./components/Routers/Perfil";
import TodoList from "./components/Routers/TodoList";
import Cotas from "./components/Layout/Cotas";
import Carteira from "./components/Routers/Carteira";
import Relatorio from "./components/Routers/Relatorio";
import Visualizar from "./components/Routers/Visualizar";
import SuporteComercial from "./components/Layout/SuporteComercial";
import SuporteComercialVisualizar from "./components/Layout/SuporteComercialVisualizar";
import Pdu from "./components/Routers/Pdu";
import HUB from "./components/Routers/HUB";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/Carteira",
        element: <Carteira />,
      },
      {
        path: "/Relatorio",
        element: <Relatorio />,
      },
      {
        path: "/MIS",
        element: <MIS />,
      },
      {
        path: "/Visualizar/:id/:nm_contrato",
        element: <Visualizar />,
      },
      {
        path: "/Perfil",
        element: <Perfil />,
      },
      {
        path: "/HUB",
        element: <HUB />,
      },
      {
        path: "/HUB/:id",
        element: <HUB />,
      },
      {
        path: "/SuporteComercial",
        element: <SuporteComercial />,
      },
      {
        path: "/SuporteComercialVisualizar/:id",
        element: <SuporteComercialVisualizar />,
      },
      {
        path: "/Cotas",
        element: <Cotas />,
      },
      {
        path: "/TodoList/:login",
        element: <TodoList />,
      },
      {
        path: "/pdu",
        element: <Pdu />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
