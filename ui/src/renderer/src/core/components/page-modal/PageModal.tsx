import styles from "./page-modal.module.css"
import { Children, Fragment, isValidElement } from "react"
import ModalHeader from "./modal-header/ModalHeader"
import ModalBody from "./modal-body/ModalBody"
import ModalFooter from "./modal-footer/ModalFooter"

/**
 * Searches recursively for a specific component type within a React children tree.
 * This allows a parent component to find and rearrange specific children.
 */
const findComponentInChildren = (children: React.ReactNode, componentType: React.ElementType) => {
  const childrenArray = Children.toArray(children)
  for (const child of childrenArray) {
    if (isValidElement(child)) {
      if (child.type === Fragment) {
        const child_props = child.props as React.FragmentProps
        return findComponentInChildren(child_props.children, componentType)
      }
      if (child.type === componentType) {
        return child
      }
    }
  }
  return null
}

interface ModalProps {
  /** Modal content: should include ModalHeader, ModalBody, ModalFooter */
  children: React.ReactNode
  /** Optional class name for custom modal styling */
  className?: string
}

/**
 * A structural layout component for modals. It acts as a compound component,
 * expecting `ModalHeader`, `ModalBody`, and `ModalFooter` as children,
 * and arranges them in a fixed layout regardless of their order.
 *
 * @param {React.ReactNode} props.children - The child elements. Should include instances of `ModalHeader`, `ModalBody`, and `ModalFooter`.
 * @param {string} [props.className] - An optional CSS class to apply to the main modal container.
 * @returns {React.ReactElement} The rendered modal layout component.
 */
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
