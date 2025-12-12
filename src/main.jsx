import ReactDOM from "react-dom/client";
import React from "react";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./features/auth/hooks/useAuth";
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ThemeProvider>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </ThemeProvider>
  </AuthProvider>
);
