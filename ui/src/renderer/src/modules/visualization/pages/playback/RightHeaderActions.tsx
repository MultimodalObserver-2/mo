import OpenInNewIcon from "@renderer/core/components/icons/OpenInNewIcon"
import { IDockviewHeaderActionsProps } from "dockview"
import { useEffect, useState } from "react"

export default function RightHeaderActions(props: IDockviewHeaderActionsProps) {
  const [isPopout, setIsPopout] = useState(props.api.location.type === "popout")

  useEffect(() => {
    const disposable = props.api.onDidLocationChange(() => {
      setIsPopout(props.api.location.type === "popout")
    })

    return () => {
      disposable.dispose()
    }
  }, [props.containerApi])

  const handleOpenWindow = () => {
    if (props.api.location.type !== "popout") {
      props.containerApi.addPopoutGroup(props.group, {
        popoutUrl: `./index.html#/visualization/sessions/playback/popout?internal=true`
      })
    } else {
      props.api.moveTo({ position: "right" })
    }
  }
  return (
    !isPopout && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0px 8px",
          height: "100%",
          color: "var(--color-text-dark)"
        }}
      >
        <button
          onClick={handleOpenWindow}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          <OpenInNewIcon
            style={{
              width: "18px",
              height: "18px",
              fill: "var(--color-text-dark)"
            }}
          />
        </button>
      </div>
    )
  )
}
