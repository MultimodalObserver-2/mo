import styles from "./page-modal.module.css"
import { Children, Fragment, isValidElement, Suspense } from "react"
import ModalHeader from "./modal-header/ModalHeader"
import ModalBody from "./modal-body/ModalBody"
import ModalFooter from "./modal-footer/ModalFooter"

const findComponentInChildren = (children: React.ReactNode, componentType: React.ElementType) => {
  return Children.toArray(children).find((child) => {
    if (isValidElement(child)) {
      // console.log("child", child.type)
      if (child.type === Fragment) {
        console.log("Child is a fragment")
        const child_props = child.props as React.FragmentProps
        return findComponentInChildren(child_props.children, componentType)
      }

      return child.type === componentType
    }
    return false
  })
}

interface ModalProps {
  children: React.ReactNode
  className?: string
}

export default function PageModal({ children, className }: ModalProps) {
  // const elements = Children.toArray(children)

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
