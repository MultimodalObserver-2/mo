import styles from "./activity-message.module.css"
import Button from "@renderer/core/components/button/Button"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { useEffect, useRef } from "react"
import { useParams, useSearchParams } from "react-router"

export default function ActivityMessagePage() {
  const { activityName } = useParams<{ activityName: string }>()
  const [searchParams] = useSearchParams()
  const messageRef = useRef<HTMLDivElement>(null)
  const buttons = searchParams.get("button")?.split(",")

  const handleClick = (index) => {
    window.organization.activityMessageButtonClicked(index)
  }

  useEffect(() => {
    if (!messageRef.current) return
    const contentHeight = 115
    const messageScrollHeight = messageRef.current?.scrollHeight || 0
    window.organization.setActivityMessageHeight(messageScrollHeight + contentHeight)
  }, [])

  return (
    <PageModal className={styles.modal}>
      <ModalHeader>
        <ModalTitle
          className={styles.title}
          iconClassName={styles.icon}
          title={activityName || ""}
          Icon={InfoIcon}
        />
      </ModalHeader>
      <ModalBody>
        <p ref={messageRef}>{searchParams.get("message") || ""}</p>
      </ModalBody>
      <ModalFooter>
        {buttons?.map((button, index) => (
          <Button key={index} onClick={() => handleClick(index)}>
            {button}
          </Button>
        ))}
      </ModalFooter>
    </PageModal>
  )
}
