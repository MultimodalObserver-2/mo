export default interface OrganizationAPI {
  reloadProjects: () => void
  onReloadProjects: (callback: () => void) => () => void
  reloadParticipants: () => () => void
  onReloadParticipants: (callback: () => void) => () => void
  changeSelectedProject: (project) => void
  onChangeSelectedProject: (callback: (project) => void) => () => void
  changeSelectedParticipant: (participant) => void
  onChangeSelectedParticipant: (callback: (participant) => void) => () => void
  addActivity: (activity) => void
  onAddActivity: (callback: (activity) => void) => void
  removeAddActivity: () => void
  updateActivity: (originalName, activity) => void
  onUpdateActivity: (callback: (originalName, activity) => void) => void
  removeUpdateActivity: () => void
  reloadProtocols: () => void
  onReloadProtocols: (callback: () => void) => () => void
  changeSelectedProtocol: (protocol) => void
  onChangeSelectedProtocol: (callback: (protocol) => void) => () => () => void
  execProtocol: (projectName: string, protocolName: string) => void
  onExecProtocolFinished: (callback: () => void) => () => void
  stopProtocolExecution: () => void
  getProtocolExecutionStatus: () => Promise<{
    isRunning: boolean
    projectName: string | null
    protocolName: string | null
  }>
  activityMessageButtonClicked: (idx) => void
  setActivityMessageHeight: (height) => void
  onActivityTimerChange: (callback: (seconds: number) => void) => void
  onActivityTimerStart: (callback: (initialSeconds) => void) => void
  onActivityTimerStop: (callback: () => void) => void
  setProject: (projectUuid: string | null) => Promise<void>
  setParticipant: (participantUuid: string | null) => Promise<void>
  preferences: {
    state: {
      getProject: () => Promise<string | null>
      getParticipant: () => Promise<string | null>
      getProtocol: () => Promise<string | null>
      setProject: (projectUuid: string | null) => Promise<void>
      setParticipant: (participantUuid: string | null) => Promise<void>
      setProtocol: (protocolUuid: string | null) => Promise<void>
    }
  }
}
