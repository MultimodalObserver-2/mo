import AppShell from "@renderer/core/components/app-shell/AppShell"
import Workspace from "@renderer/core/components/app-shell/Workspace"
import WorkspaceHeader from "@renderer/core/components/app-shell/WorkspaceHeader"
import WorkspaceBody from "@renderer/core/components/app-shell/WorkspaceBody"
import WorkspaceFooter from "@renderer/core/components/app-shell/WorkspaceFooter"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const meta: Meta<typeof AppShell> = {
  title: "Core/Layouts/AppShell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "AppShell es el layout principal. Usa Workspace y sus secciones para estructurar páginas con header, body y footer. El panel lateral se monta automáticamente según el registro."
      }
    }
  },
  argTypes: {
    children: { control: false }
  }
}
export default meta

type Story = StoryObj<typeof AppShell>

const ExampleHeader = () => <WorkspaceHeader><h1>Header</h1></WorkspaceHeader>
const ExampleBody = () => <WorkspaceBody><p>Contenido principal</p></WorkspaceBody>

export const Default: Story = {
  render: () => (
    <AppShell>
      <Workspace>
        <WorkspaceHeader>
          <h1>Header</h1>
        </WorkspaceHeader>
        <WorkspaceBody>
          <p>Contenido principal</p>
        </WorkspaceBody>
        <WorkspaceFooter>Footer</WorkspaceFooter>
      </Workspace>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Header")).toBeInTheDocument()
    await expect(canvas.getByText("Contenido principal")).toBeInTheDocument()
    await expect(canvas.getByText("Footer")).toBeInTheDocument()
  }
}

export const SinFooter: Story = {
  render: () => (
    <AppShell>
      <Workspace>
        <WorkspaceHeader>
          <h1>Header</h1>
        </WorkspaceHeader>
        <WorkspaceBody>
          <p>Contenido principal</p>
        </WorkspaceBody>
        {/* No footer */}
      </Workspace>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText("Footer")).not.toBeInTheDocument()
  }
}

export const FooterBorderless: Story = {
  render: () => (
    <AppShell>
      <Workspace>
        <ExampleHeader />
        <ExampleBody />
        <WorkspaceFooter borderless>Sin borde</WorkspaceFooter>
      </Workspace>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Sin borde")).toBeInTheDocument()
  }
}

export const SoloBody: Story = {
  render: () => (
    <AppShell>
      <Workspace>
        <WorkspaceBody>Solo contenido</WorkspaceBody>
      </Workspace>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Solo contenido")).toBeInTheDocument()
  }
}

export const CustomHeaderBodyFooter: Story = {
  render: () => (
    <AppShell>
      <Workspace>
        <WorkspaceHeader>
          <div data-testid="custom-header">Header personalizado</div>
        </WorkspaceHeader>
        <WorkspaceBody>
          <div data-testid="custom-body">Cuerpo personalizado</div>
        </WorkspaceBody>
        <WorkspaceFooter>
          <div data-testid="custom-footer">Footer personalizado</div>
        </WorkspaceFooter>
      </Workspace>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId("custom-header")).toBeInTheDocument()
    await expect(canvas.getByTestId("custom-body")).toBeInTheDocument()
    await expect(canvas.getByTestId("custom-footer")).toBeInTheDocument()
  }
}
