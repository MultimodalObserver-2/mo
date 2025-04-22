export default function Show({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <>{show && <>{children}</>}</>
}
