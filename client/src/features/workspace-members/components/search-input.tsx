import { useState, useEffect } from "react"
import { Search } from "lucide-react"

interface MemberSearchInputProps {
  onSearchChange: (value: string) => void
}

export function MemberSearchInput({ onSearchChange }: MemberSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm, onSearchChange])

  return (
    <div className="mb-4 flex max-w-xs items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-primary">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        type="text"
        placeholder="Search members..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-sm"
      />
    </div>
  )
}
