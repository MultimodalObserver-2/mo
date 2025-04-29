import styles from "./page-modal.module.css"
import { Children, Fragment, isValidElement } from "react"
import ModalHeader from "./modal-header/ModalHeader"
import ModalBody from "./modal-body/ModalBody"
import ModalFooter from "./modal-footer/ModalFooter"

/** Searches recursively for a specific component type within a React children tree. **/
const findComponentInChildren = (children: React.ReactNode, componentType: React.ElementType) => {
  return Children.toArray(children).find((child) => {
    if (isValidElement(child)) {
      if (child.type === Fragment) {
        const child_props = child.props as React.FragmentProps
        return findComponentInChildren(child_props.children, componentType)
      }
      return child.type === componentType
    }
    return false
  })
}

interface ModalProps {
  /** Modal content: should include ModalHeader, ModalBody, ModalFooter */
  children: React.ReactNode
  /** Optional class name for custom modal styling */
  className?: string
}

/** Layout wrapper for modal content composed of header, body, and footer components */
export default function PageModal({ children, className }: Readonly<ModalProps>) {
  const header = findComponentInChildren(children, ModalHeader)
  const body = findComponentInChildren(children, ModalBody)
  const footer = findComponentInChildren(children, ModalFooter)

  return (
    <main className={`${styles.modal} ${className}`}>
      {header}
      <hr className={styles.line} />
      {body}
      {footer}
    </main>
  )
}
