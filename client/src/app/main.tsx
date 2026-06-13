import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/index.css"
import { AppProviders } from "@/app/providers/app-providers"
import { AppRouter } from "@/app/router/app-router"

export function mountApp() {
  const rootElement = document.getElementById("root")

  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </StrictMode>
    )
  }
}
