import { app, ipcMain } from "electron"
import preferencesManager from "../../core/preferences/PreferencesManager"

type OrganizationStates = {
  selectedProject: string | null
  // Map project uuid with participant uuid
  selectedParticipants: Record<string, string | null>
  // Map project uuid with protocol uuid
  selectedProtocols: Record<string, string | null>
}

type OrganizationPreferences = {
  states?: OrganizationStates
}

function getOrganizationPreferences(): OrganizationPreferences | undefined {
  const preferences = preferencesManager.get<OrganizationPreferences>("organization")
  return preferences
}

app.whenReady().then(() => {
  ipcMain.handle("organization:preferences:get:state:project", async () => {
    const preferences = getOrganizationPreferences()
    return preferences?.states?.selectedProject ?? null
  })

  ipcMain.handle("organization:preferences:get:state:participant", async () => {
    const preferences = getOrganizationPreferences()
    const project = preferences?.states?.selectedProject
    const participant = preferences?.states?.selectedParticipants[project ?? ""]
    return participant ?? null
  })

  ipcMain.handle("organization:preferences:get:state:protocol", async () => {
    const preferences = getOrganizationPreferences()
    const project = preferences?.states?.selectedProject
    const protocol = preferences?.states?.selectedProtocols[project ?? ""]
    return protocol ?? null
  })

  ipcMain.handle(
    "organization:preferences:set:state:project",
    async (_event, projectUuid: string | null) => {
      const preferences = getOrganizationPreferences() || {}
      if (!preferences.states) {
        preferences.states = {
          selectedProject: null,
          selectedParticipants: {},
          selectedProtocols: {}
        }
      }
      preferences.states.selectedProject = projectUuid
      preferencesManager.extend("organization", preferences)
    }
  )

  ipcMain.handle(
    "organization:preferences:set:state:participant",
    async (_event, participantUuid: string | null) => {
      const preferences = getOrganizationPreferences() ?? {}
      if (!preferences.states) {
        preferences.states = {
          selectedProject: null,
          selectedParticipants: {},
          selectedProtocols: {}
        }
      }
      const projectUuid = preferences.states.selectedProject
      if (!projectUuid) {
        throw new Error("No project selected to set participant")
      }
      preferences.states.selectedParticipants[projectUuid] = participantUuid
      preferencesManager.extend("organization", preferences)
    }
  )

  ipcMain.handle(
    "organization:preferences:set:state:protocol",
    async (_event, protocolUuid: string | null) => {
      const preferences = getOrganizationPreferences() ?? {}
      if (!preferences.states) {
        preferences.states = {
          selectedProject: null,
          selectedParticipants: {},
          selectedProtocols: {}
        }
      }
      const projectUuid = preferences.states.selectedProject
      if (!projectUuid) {
        throw new Error("No project selected to set protocol")
      }
      preferences.states.selectedProtocols[projectUuid] = protocolUuid
      preferencesManager.extend("organization", preferences)
    }
  )
})
