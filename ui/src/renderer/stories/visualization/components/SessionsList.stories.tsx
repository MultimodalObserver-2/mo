import SessionsList from "@renderer/modules/visualization/components/sessions-list/SessionsList"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const mockSessions = [
  {
    session_id: "session-1",
    location: "Room 101",
    start_timestamp: 1672567200,
    end_timestamp: 1672570800,
    paused_time: 0,
    started_at: "2023-01-01T10:00:00Z",
    ended_at: "2023-01-01T11:00:00Z",
    duration: 3600,
    paused_intervals: [],
    capture_sources: [
      {
        type: "Camera",
        config: {},
        config_id: "config-1",
        config_name: "Default Camera Config",
        plugin_id: "plugin-1",
        plugin_name: "Camera Plugin",
        plugin_version: "1.0.0",
        start_timestamp: 1672567200,
        file_extension: "mp4",
        settings: {}
      },
      {
        type: "Microphone",
        config: {},
        config_id: "config-2",
        config_name: "Default Microphone Config",
        plugin_id: "plugin-2",
        plugin_name: "Microphone Plugin",
        plugin_version: "1.0.0",
        start_timestamp: 1672567200,
        file_extension: "wav",
        settings: {}
      }
    ]
  },
  {
    session_id: "session-2",
    location: "Room 102",
    start_timestamp: 1672672200,
    end_timestamp: 1672675800,
    paused_time: 0,
    started_at: "2023-01-02T12:30:00Z",
    ended_at: "2023-01-02T13:30:00Z",
    duration: 1800,
    paused_intervals: [],
    capture_sources: [
      {
        type: "Camera",
        config: {},
        config_id: "config-3",
        config_name: "Default Camera Config 2",
        plugin_id: "plugin-1",
        plugin_name: "Camera Plugin",
        plugin_version: "1.0.0",
        settings: {}
      }
    ]
  }
]

// @ts-ignore
window.capture = {
    onReloadSessions: () => () => {},
}

const meta: Meta<typeof SessionsList> = {
  title: "Visualization/Components/SessionsList",
  component: SessionsList,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Panel listing the available capture sessions for a given project and participant, allowing session selection and management."
      }
    }
  },
  argTypes: {
    projectName: { control: "text" },
    participantCode: { control: "text" },
    selectedSession: { control: false },
    visible: { control: "boolean" }
  }
}
export default meta
type Story = StoryObj<typeof SessionsList>

export const Default: Story = {
  args: {
    projectName: "Mock Project",
    participantCode: "P1",
    selectedSession: mockSessions[0],
    onSessionSelected: () => {},
    visible: true
  },
  render: (args) => (
    <SessionsList
      {...args}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/availableSessions/i)).toBeInTheDocument()
  }
}
