import Button from "@renderer/core/components/button/Button"
import SmartDisplayIcon from "@renderer/core/components/icons/SmartDisplayIcon"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import sessionService from "@renderer/modules/capture/services/SessionService"
import { Await, useParams } from "react-router"
import playbackConfigService from "../../services/PlaybackConfigService"
import playbackService from "../../services/PlaybackService"
import { Suspense } from "react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import pluginService from "@renderer/core/services/PluginService"
import Select from "@renderer/core/components/select/Select"

interface CaptureDetail {
  configName: string
  pluginName: string
  location: string
  fileName: string
}

interface PlaybackData {
  name: string
  id: string
  captures: CaptureDetail[]
}

export default function StartPlayback() {
  const { projectName, participantCode, sessionId } = useParams<{
    projectName: string
    participantCode: string
    sessionId: string
  }>()

  if (!projectName || !participantCode || !sessionId) {
    window.close()
    return null
  }

  const closeModalWindow = () => {
    window.close()
  }

  const handleStartPlayback = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const selectedCaptures: { [key: string]: string } = {}
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) {
        selectedCaptures[key] = value
      }
    }
    const params = new URLSearchParams(selectedCaptures).toString()

    window.core.router.navigate(
      `/visualization/${projectName}/participants/${participantCode}/sessions/${sessionId}/playback?${params}`
    )
  }

  const getData = async () => {
    await pluginService.loadAllUiPlugins()
    const sessionsRes = await sessionService.get(projectName, participantCode, sessionId)
    const sessions = sessionsRes.data
    const configs = await playbackConfigService.getAll(projectName)

    const result: PlaybackData[] = configs.map((config) => {
      const validExts = playbackService
        .getPluginValidExtensions(config.plugin_id)
        .map((ext) => ext.toLowerCase().replace(/^\./, ""))

      const captures: CaptureDetail[] = sessions.capture_sources
        .filter((source) => {
          const ext = source.file_extension?.toLowerCase().replace(/^\./, "")
          if (!ext) {
            return false
          }
          return validExts.includes(ext)
        })
        .map((source) => {
          const location = source.location ?? ""
          const fileName = location.split(/[/\\]/).pop() || ""
          return {
            configName: source.config_name,
            pluginName: source.plugin_name,
            location: location,
            fileName: fileName
          }
        })
      return {
        name: config.name,
        id: config.id,
        captures: captures
      }
    })

    return result
  }

  const dataPromise = getData()

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Start Playback" Icon={SmartDisplayIcon} />
      </ModalHeader>
      <ModalBody id="start-playback" type="form" onSubmit={handleStartPlayback}>
        <Suspense fallback={<p>Loading...</p>}>
          <Await resolve={dataPromise} errorElement={<ErrorElement name="Start Playback" />}>
            {(playbackData: PlaybackData[]) => (
              <>
                <h4 style={{ fontSize: "1.1em", fontWeight: "400" }}>
                  Select captured files for playback
                </h4>
                {playbackData.map((data) => (
                  <Select
                    key={data.id}
                    name={data.id}
                    label={data.name}
                    placeholder={`Select a capture`}
                    required
                  >
                    {data.captures.map((capture) => (
                      <option key={capture.configName} value={capture.configName}>
                        {`${capture.fileName} – ${capture.pluginName}`}
                      </option>
                    ))}
                  </Select>
                ))}
              </>
            )}
          </Await>
        </Suspense>
      </ModalBody>
      <ModalFooter>
        <Button form="start-playback">START PLAYBACK</Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          CANCEL
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
