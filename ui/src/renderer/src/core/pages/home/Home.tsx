import {
  Workspace,
  WorkspaceBody,
  WorkspaceFooter,
  WorkspaceHeader
} from "@renderer/core/components/app-shell"
import homePageRegistry from "@renderer/core/store/homePageRegistry"

export default function Home() {
  return (
    <Workspace>
      <WorkspaceHeader>
        {homePageRegistry.getHeaders().map((header) => (
          <header.render key={header.id} />
        ))}
      </WorkspaceHeader>
      <WorkspaceBody>{homePageRegistry.getBody()?.render()}</WorkspaceBody>
      <WorkspaceFooter></WorkspaceFooter>
    </Workspace>
  )
}
