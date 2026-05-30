import { AppShellLayout } from "../layouts/app-shell"
import { ProjectsPage } from "../../pages/projects/projects-page"
import { SettingsPage } from "../../pages/settings/settings-page"
import { Navigate, createBrowserRouter } from "react-router-dom"

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppShellLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/projects/cloudkitchen" replace />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:projectId",
        element: <ProjectsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
