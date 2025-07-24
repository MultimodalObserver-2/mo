import PlaybackCapturedFiles from "@renderer/modules/visualization/components/playback-captured-files/PlaybackCapturedFiles"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const mockSession = {
  session_id: "session-1",
  location: "Room 101",
  start_timestamp: 1718000000,
  started_at: "2024-06-10T10:00:00Z",
  duration: 3600,
  capture_sources: [
    {
      config_id: "cfg-1",
      config_name: "Video Config",
      plugin_id: "plugin-1",
      plugin_version: "1.0.0",
      settings: {},
      file_extension: "mp4",
      location: "recording1.mp4",
      plugin_name: "VideoPlugin"
    },
    {
      config_id: "cfg-2",
      config_name: "Audio Config",
      plugin_id: "plugin-2",
      plugin_version: "1.0.0",
      settings: {},
      file_extension: "wav",
      location: "audio1.wav",
      plugin_name: "AudioPlugin"
    }
  ]
}

// @ts-ignore
window.core.app.paths = {
  plugins: () => Promise.resolve("/mock/plugins/path")
}


const meta: Meta<typeof PlaybackCapturedFiles> = {
  title: "Visualization/Components/PlaybackCapturedFiles",
  component: PlaybackCapturedFiles,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Selector UI for choosing which captured files to use in session playback. Lists valid captures per plugin and allows switching."
      }
    }
  },
  argTypes: {
    projectName: { control: "text" },
    session: { control: false },
    visible: { control: "boolean" }
  }
}
export default meta
type Story = StoryObj<typeof PlaybackCapturedFiles>

function resolvePromise(data) {
  return { then: (res) => setTimeout(() => res(data), 1) }
}

const mockPlaybackData = [
  {
    id: "plugin-1",
    name: "Video Config",
    plugin_id: "plugin-1",
    plugin_icon: "",
    plugin_is_loaded: true,
    visible: true,
    capture_config_id: "cfg-1",
    settings: {},
    captures: [
      {
        config_id: "cfg-1",
        file_extension: "mp4",
        location: "recording1.mp4",
        plugin_name: "VideoPlugin"
      }
    ],
    hasDefault: true
  },
  {
    id: "plugin-2",
    name: "Audio Config",
    plugin_id: "plugin-2",
    plugin_icon: "",
    plugin_is_loaded: true,
    visible: true,
    capture_config_id: "cfg-2",
    settings: {},
    captures: [
      {
        config_id: "cfg-2",
        file_extension: "wav",
        location: "audio1.wav",
        plugin_name: "AudioPlugin"
      }
    ],
    hasDefault: true
  }
]

export const Default: Story = {
  args: {
    projectName: "Mock Project",
    session: mockSession,
    visible: true
  },
  render: (args) => {
    // Patch Await.resolve to instantly resolve with mockPlaybackData
    const RealAwait = require("react-router").Await
    const MockAwait = ({ resolve, children }) =>
      RealAwait({ resolve: resolvePromise(mockPlaybackData), children })

    const PlaybackCapturedFilesPatched = (props) => <PlaybackCapturedFiles {...props} />

    // Replace Await with the mocked one for the story only
    PlaybackCapturedFilesPatched.Await = MockAwait

    return <PlaybackCapturedFiles {...args} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/select files for playback/i)).toBeInTheDocument()
    expect(canvas.getByLabelText("Video Config")).toBeInTheDocument()
    expect(canvas.getByLabelText("Audio Config")).toBeInTheDocument()
  }
}
