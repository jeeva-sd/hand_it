import { Outlet } from "react-router-dom"

import { appConfig } from "@/config"

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_20%,rgba(34,197,94,0.08),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.08),transparent_32%),linear-gradient(160deg,#f8fafc_0%,#eff6ff_45%,#ecfeff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-8 lg:px-8">
        <section className="w-full max-w-md rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl backdrop-blur md:p-7">
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="text-xl font-bold text-primary">{appConfig.app.name}</p>
            <p className="text-sm text-muted-foreground">Professional file delivery platform</p>
          </div>
          <Outlet />
        </section>
      </div>
    </div>
  )
}
