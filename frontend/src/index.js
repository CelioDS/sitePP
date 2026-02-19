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
import Carteira from "./components/Routers/Carteira";
import Relatorio from "./components/Routers/Relatorio";
import Visualizar from "./components/Routers/Visualizar";

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
        path: "/TodoList/:login",
        element: <TodoList />,
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
