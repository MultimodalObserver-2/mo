import { ActivityCreate } from "../types/Protocol"

// Projects Modal Windows
export function openProjectInfoModal(projectName: string) {
  window.core.openModalWindow(
    { width: 720, height: 430, minWidth: 650, minHeight: 430, title: "Project Information" },
    `organization/projects/${projectName}`
  )
}

export function openCreateProjectModal() {
  window.core.openModalWindow(
    { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Create Project" },
    "organization/create-project"
  )
}

export function openUpdateProjectModal(projectName: string) {
  window.core.openModalWindow(
    { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Update Project" },
    `organization/update-project/${projectName}`
  )
}

// Participants Modal Windows
export function openParticipantInfoModal(projectName: string, participantCode: string) {
  window.core.openModalWindow(
    { width: 720, height: 510, minWidth: 650, minHeight: 500, title: "Participant Information" },
    `organization/${projectName}/participants/${participantCode}`
  )
}

export function openAddParticipantModal(projectName: string) {
  window.core.openModalWindow(
    { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Add Participant" },
    `organization/${projectName}/add-participant`
  )
}

export function openUpdateParticipantModal(projectName: string, participantCode: string) {
  window.core.openModalWindow(
    { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Update Participant" },
    `organization/${projectName}/update-participant/${participantCode}`
  )
}

// Protocols Modal Windows
export function openAddProtocolModal(projectName: string) {
  window.core.openModalWindow(
    { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Add Protocol" },
    `organization/${projectName}/add-protocol`,
    "main",
    "add-protocol"
  )
}

// Activities Modal Windows
export function openAddActivityModal() {
  window.core.openModalWindow(
    { width: 650, height: 630, minWidth: 620, minHeight: 630, title: "Protocol: Add Activity" },
    `organization/add-activity`,
    "add-protocol"
  )
}

export function openEditActivityModal(activity: ActivityCreate) {
  window.core.openModalWindow(
    { width: 650, height: 630, minWidth: 620, minHeight: 630, title: "Protocol: Edit Activity" },
    `organization/edit-activity?name=${activity.name}&path=${activity.path}&has_time_limit=${activity.has_time_limit}&time_limit=${activity.time_limit}&start_message=${activity.start_message}&end_message=${activity.end_message}&close_activity=${activity.close_activity}&show_timer=${activity.show_timer}`,
    "add-protocol"
  )
}
