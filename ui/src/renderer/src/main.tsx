import "./assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { BrowserRouter, Route, Routes } from "react-router"
import Sidebar from "./components/sidebar/Sidebar"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Sidebar />
      <Routes>
        <Route index path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
