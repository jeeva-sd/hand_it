import { Button } from "@/components/ui/button"
import { useSearchParams } from "react-router-dom"

type SettingsTab = "members" | "billing" | "settings"

const sectionCopy: Record<SettingsTab, { title: string; description: string }> = {
  members: {
    title: "Members",
    description: "Invite teammates, control access, and review activity permissions.",
  },
  billing: {
    title: "Billing",
    description: "Manage plan details, payment methods, and upcoming invoices.",
  },
  settings: {
    title: "Workspace Settings",
    description: "Configure project defaults, upload limits, and workspace behaviors.",
  },
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTab = searchParams.get("tab")

  const activeTab: SettingsTab =
    selectedTab === "members" || selectedTab === "billing" || selectedTab === "settings"
      ? selectedTab
      : "settings"

  const setTab = (tab: SettingsTab) => {
    setSearchParams({ tab })
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep workspace administration lightweight and focused.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        <Button variant={activeTab === "members" ? "default" : "ghost"} onClick={() => setTab("members")}>
          Members
        </Button>
        <Button variant={activeTab === "billing" ? "default" : "ghost"} onClick={() => setTab("billing")}>
          Billing
        </Button>
        <Button variant={activeTab === "settings" ? "default" : "ghost"} onClick={() => setTab("settings")}>
          Settings
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-lg font-medium">{sectionCopy[activeTab].title}</h3>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{sectionCopy[activeTab].description}</p>
      </div>
    </section>
  )
}
