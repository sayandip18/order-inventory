import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
      <Button variant="outline" onClick={logout}>
        Sign Out
      </Button>
    </div>
  )
}
