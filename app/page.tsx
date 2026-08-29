import { AppSidebar } from "@/components/perplexity/app-sidebar"
import { TopNav } from "@/components/perplexity/top-nav"
import { SessionProvider } from "@/components/life-guardian/session-provider"
import { Workspace } from "@/components/life-guardian/workspace"

export default function Home() {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <Workspace />
        </div>
      </div>
    </SessionProvider>
  )
}
