import * as React from "react"
import { type AppRole, roleHint } from "../types"

export const RoleHintsSection = React.memo(() => {
  return (
    <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {(["Owner", "Admin", "Member"] as AppRole[]).map((r) => (
        <div key={r} className="rounded-lg border bg-card p-4">
          <div className="text-sm font-semibold">{r}</div>
          <div className="mt-1 text-xs text-muted-foreground">{roleHint[r]}</div>
        </div>
      ))}
    </section>
  )
})

RoleHintsSection.displayName = "RoleHintsSection"
