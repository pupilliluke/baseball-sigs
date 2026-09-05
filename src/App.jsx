import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppShell from "./app/AppShell";
import Studio from "./pages/Studio";
import Collection from "./pages/Collection";
import Gallery from "./pages/Gallery";
import About from "./pages/About";

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Collection /> },
      { path: "/studio", element: <Studio /> },
      { path: "/gallery", element: <Gallery /> },
      { path: "/about", element: <About /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
