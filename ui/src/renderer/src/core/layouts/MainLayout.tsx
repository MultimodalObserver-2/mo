import { Outlet } from "react-router"
import Sidebar from "../components/sidebar/Sidebar"

export default function MainLayout() {
  return (
    <>
      <Sidebar />
      <Outlet />
    </>
  )
}
