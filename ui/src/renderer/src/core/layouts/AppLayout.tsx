import { Outlet } from "react-router"
import Sidebar from "../components/sidebar/Sidebar"
import { AppShell } from "../components/app-shell"

export default function AppLayout() {
  return (
    <>
      <Sidebar />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  )
}
