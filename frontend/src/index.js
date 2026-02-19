import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import Error from "./components/Routers/Error";
import Home from "./components/Routers/Home";
import Carteira from "./components/Routers/Carteira";
import Relatorio from "./components/Routers/Relatorio";
import Visualizar from "./components/Routers/Visualizar";
import Perfil from "./components/Routers/Perfil";
import TodoList from "./components/Routers/TodoList";

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
