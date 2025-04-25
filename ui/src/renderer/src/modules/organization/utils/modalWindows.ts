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
