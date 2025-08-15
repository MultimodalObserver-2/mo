import { useTranslation } from "react-i18next"
import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { Await, useParams } from "react-router"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { PlaybackConfigUpdate } from "../../types/PlaybackConfig"
import playbackConfigService from "../../services/PlaybackConfigService"
import { Suspense } from "react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import playbackService from "../../services/PlaybackService"
import Select from "@renderer/core/components/select/Select"

export default function UpdatePlaybackConfig() {
  const { t } = useTranslation("visualization", { keyPrefix: "pages.updatePlaybackConfig" })
  const { projectName, configName } = useParams<{ projectName: string; configName: string }>()

  if (!projectName || !configName) {
    window.close()
    return
  }

  const addPlaybackView = async (
    name: string,
    pluginId: string,
    settings: Record<string, string | number | boolean>,
    extra: Record<string, string | number | boolean> = {}
  ) => {
    const config: PlaybackConfigUpdate = {
      name: name,
      settings: settings,
      capture_config_id: extra.capture_config_id as string
    }
    try {
      await playbackConfigService.update(projectName, pluginId, configName, config)
      window.visualization.reloadPlaybackConfigs()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  const fetchPlaybackConfig = async () => {
    const playbackConfig = await playbackConfigService.get(projectName, configName)
    const validCaptureConfigs = await playbackService.getPluginValidCaptureConfigs(
      projectName,
      playbackConfig.plugin_id
    )
    return {
      ...playbackConfig,
      validCaptureConfigs: validCaptureConfigs
    }
  }

  const playbackConfigPromise = fetchPlaybackConfig()

  return (
    <Suspense
      fallback={
        <div
          style={{
            backgroundColor: "var(--color-primary-700)",
            color: "var(--color-text-light)",
            width: "100%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        ></div>
      }
    >
      <Await
        resolve={playbackConfigPromise}
        errorElement={<ErrorElement name={t("playbackConfig")} />}
      >
        {(playbackConfig) => {
          return (
            <ConfigurePlugin
              pluginId={playbackConfig.plugin_id}
              target="ui"
              submitLabel={t("updateView").toUpperCase()}
              onSubmit={(name, settings, extra) =>
                addPlaybackView(name, playbackConfig.plugin_id, settings, extra)
              }
              onClose={closeModalWindow}
              initialConfigName={playbackConfig.name}
              initialSettings={playbackConfig.settings}
            >
              <Select
                label={t("captureConfig")}
                placeholder={t("selectCaptureConfig")}
                name="capture_config_id"
                defaultValue={playbackConfig.capture_config_id}
                required
              >
                {playbackConfig.validCaptureConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </Select>
            </ConfigurePlugin>
          )
        }}
      </Await>
    </Suspense>
  )
}
