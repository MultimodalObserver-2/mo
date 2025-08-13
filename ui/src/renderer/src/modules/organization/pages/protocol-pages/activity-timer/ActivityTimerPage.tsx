import styles from "./activity-timer.module.css"
import { useEffect, useRef, useState } from "react"

export default function ActivityTimerPage() {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          let { hours, minutes, seconds } = prev
          seconds += 1

          if (seconds > 59) {
            seconds = 0
            minutes += 1
          }

          if (minutes > 59) {
            minutes = 0
            hours += 1
          }

          return { hours, minutes, seconds }
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  useEffect(() => {
    const removeTimerChange = window.organization.onActivityTimerChange((sec) => {
      const totalSeconds = sec
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const finalSeconds = totalSeconds % 60

      setTime({ hours, minutes, seconds: finalSeconds })
    })

    const removeTimerStart = window.organization.onActivityTimerStart((initialSeconds) => {
      const totalSeconds = initialSeconds
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const finalSeconds = totalSeconds % 60

      setTime({ hours, minutes, seconds: finalSeconds })
      setIsRunning(true)
    })

    const removeTimerStop = window.organization.onActivityTimerStop(() => {
      if (intervalRef.current) {
        setTime({ hours: 0, minutes: 0, seconds: 0 })
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      setIsRunning(false)
    })

    const removeTimerPause = window.organization.onActivityTimerPause(() => {
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })

    const removeTimerResume = window.organization.onActivityTimerResume(() => {
      setIsRunning(true)
    })

    return () => {
      removeTimerChange()
      removeTimerStart()
      removeTimerStop()
      removeTimerPause()
      removeTimerResume()
    }
  }, [])

  return (
    <main className={styles.timer}>
      <h1 className={styles.text}>
        {String(time.hours).padStart(2, "0")}:{String(time.minutes).padStart(2, "0")}:
        {String(time.seconds).padStart(2, "0")}
      </h1>
    </main>
  )
}
