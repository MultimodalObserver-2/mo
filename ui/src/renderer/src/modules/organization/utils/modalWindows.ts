/**
 * @module modalWindows
 * Modal utilities to open project, participant, protocol, and activity-related windows
 * in the Electron desktop application. These use the core window API exposed
 * on the global `window.core` object.
 */
import i18n from "i18next"
import { ActivityCreate } from "../types/Protocol"

const t = i18n.getFixedT(null, "organization", "modals")

// Projects Modal Windows
export function openProjectInfoModal(projectName: string) {
  window.core.openModalWindow({
    options: {
      width: 720,
      height: 430,
      minWidth: 650,
      minHeight: 430,
      title: t("project_info")
    },
    endpoint: `organization/projects/${projectName}`,
    parent: "main",
    name: "project-info"
  })
}

export function openCreateProjectModal() {
  window.core.openModalWindow({
    options: { width: 550, height: 310, minWidth: 550, minHeight: 310, title: t("create_project") },
    endpoint: "organization/create-project",
    parent: "main",
    name: "create-project"
  })
}

export function openUpdateProjectModal(projectName: string) {
  window.core.openModalWindow({
    options: { width: 550, height: 310, minWidth: 550, minHeight: 310, title: t("update_project") },
    endpoint: `organization/update-project/${projectName}`,
    parent: "main",
    name: "update-project"
  })
}

// Participants Modal Windows
export function openParticipantInfoModal(projectName: string, participantCode: string) {
  window.core.openModalWindow({
    options: {
      width: 720,
      height: 510,
      minWidth: 650,
      minHeight: 500,
      title: t("participant_info")
    },
    endpoint: `organization/${projectName}/participants/${participantCode}`,
    parent: "main",
    name: "participant-info",
    autoAdjustHeight: {
      elementId: "participant-info",
      extraHeight: 165,
      errorHeight: 500,
      setMinimumSize: true
    }
  })
}

export function openAddParticipantModal(projectName: string) {
  window.core.openModalWindow({
    options: {
      width: 550,
      height: 380,
      minWidth: 550,
      minHeight: 380,
      title: t("add_participant")
    },
    endpoint: `organization/${projectName}/add-participant`,
    parent: "main",
    name: "add-participant",
    autoAdjustHeight: {
      elementId: "create",
      extraHeight: 165,
      errorHeight: 380,
      setMinimumSize: true
    }
  })
}

export function openUpdateParticipantModal(projectName: string, participantCode: string) {
  window.core.openModalWindow({
    options: {
      width: 550,
      height: 380,
      minWidth: 550,
      minHeight: 380,
      title: t("update_participant")
    },
    endpoint: `organization/${projectName}/update-participant/${participantCode}`,
    parent: "main",
    name: "update-participant",
    autoAdjustHeight: {
      elementId: "update",
      extraHeight: 165,
      errorHeight: 380,
      setMinimumSize: true
    }
  })
}

// Protocols Modal Windows
export function openProtocolInfoModal(projectName: string, protocolName: string) {
  window.core.openModalWindow({
    options: {
      width: 800,
      height: 750,
      minWidth: 800,
      minHeight: 730,
      title: t("protocol_info")
    },
    endpoint: `organization/${projectName}/protocols/${protocolName}`,
    parent: "main",
    name: "protocol-info"
  })
}

export function openAddProtocolModal(projectName: string) {
  window.core.openModalWindow({
    options: { width: 550, height: 380, minWidth: 550, minHeight: 380, title: t("add_protocol") },
    endpoint: `organization/${projectName}/add-protocol`,
    parent: "main",
    name: "protocol"
  })
}

export function openUpdateProtocolModal(projectName: string, protocolName: string) {
  window.core.openModalWindow({
    options: {
      width: 550,
      height: 380,
      minWidth: 550,
      minHeight: 380,
      title: t("update_protocol")
    },
    endpoint: `organization/${projectName}/update-protocol/${protocolName}`,
    parent: "main",
    name: "protocol"
  })
}

// Activities Modal Windows
export function openAddActivityModal() {
  window.core.openModalWindow({
    options: {
      width: 650,
      height: 648,
      minWidth: 620,
      minHeight: 648,
      title: t("add_activity")
    },
    endpoint: `organization/add-activity`,
    parent: "protocol",
    name: "add-activity"
  })
}

export function openEditActivityModal(activity: ActivityCreate) {
  const params = new URLSearchParams({
    name: activity.name,
    path: activity.path,
    has_time_limit: String(activity.has_time_limit),
    time_limit: String(activity.time_limit),
    start_message: activity.start_message,
    end_message: activity.end_message,
    close_activity: String(activity.close_activity),
    show_timer: String(activity.show_timer),
    process_name: activity.process_name
  }).toString()

  window.core.openModalWindow({
    options: {
      width: 650,
      height: 648,
      minWidth: 620,
      minHeight: 648,
      title: t("edit_activity")
    },
    endpoint: `organization/edit-activity?${params}`,
    parent: "protocol",
    name: "edit-activity"
  })
}
