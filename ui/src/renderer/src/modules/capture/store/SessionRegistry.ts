import { JSX } from "react"
import { CaptureSession } from "../types/Session"
import { IconProps } from "@renderer/core/components/icons/IconProps"
import { Project } from "@renderer/modules/organization/types/Project"
import { Participant } from "@renderer/modules/organization/types/Participant"

export interface SessionAction {
  id: string
  element: (props: IconProps) => JSX.Element
  onClick: (project: Project, participant: Participant, session: CaptureSession) => void
}

class SessionRegistry {
  private actions: SessionAction[] = []

  registerAction(action: SessionAction): void {
    const filtered = this.actions.filter((a) => a.id !== action.id)
    this.actions = [...filtered, action]
  }

  unregisterAction(id: string): void {
    this.actions = this.actions.filter((a) => a.id !== id)
  }

  registerManyActions(newActions: SessionAction[]): void {
    newActions.forEach((action) => {
      const filtered = this.actions.filter((a) => a.id !== action.id)
      this.actions = [...filtered, action]
    })
  }

  getActions(): SessionAction[] {
    return this.actions
  }
}

const sessionRegistry = new SessionRegistry()
export default sessionRegistry
