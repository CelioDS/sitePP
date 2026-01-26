import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import Error from "./components/Routers/Error";
import Home from "./components/Routers/Home";
import Depara from "./components/Routers/Depara";
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
        path: "/depara",
        element: <Depara />,
      },
      {
        path: "/Relatorio",
        element: <Relatorio />,
      },
      {
        path: "/Visualizar/:id/:nm_contrato",
        element: <Visualizar />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
