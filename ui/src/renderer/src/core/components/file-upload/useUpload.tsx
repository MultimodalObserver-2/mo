import { useEffect, useRef, useState } from "react"

/**
 * A custom hook that encapsulates the logic for a file upload component.
 * It handles drag-and-drop events, file input changes, file type validation,
 * and both controlled (via props) and uncontrolled (internal state) behavior.
 *
 * @param {string[]} [accept] - An array of accepted file type specifiers (e.g., '.jpg', 'image/*').
 * @param {boolean} [multiple=false] - If true, allows multiple file selection.
 * @param {File[]} [files] - An array of `File` objects for controlled component behavior. The hook will sync its state to this prop.
 * @param {(files: File[]) => void} [onChangeFiles] - Callback function to enable controlled mode. It's invoked with the new list of files when a change occurs.
 * @returns {{
 * dragOver: boolean,
 * fileNames: string[],
 * hasFiles: boolean,
 * inputRef: React.RefObject<HTMLInputElement | null>,
 * onDragOver: (e: React.DragEvent<HTMLElement>) => void,
 * onDragLeave: (e: React.DragEvent<HTMLElement>) => void,
 * onDrop: (e: React.DragEvent<HTMLElement>) => void,
 * onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
 * }} An object containing state and event handlers for a file upload component.
 */
export default function useUpload(
  accept?: string[],
  multiple: boolean = false,
  files?: File[],
  onChangeFiles?: (files: File[]) => void
): {
  dragOver: boolean
  fileNames: string[]
  hasFiles: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onDragOver: (e: React.DragEvent<HTMLElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void
  onDrop: (e: React.DragEvent<HTMLElement>) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
} {
  const [dragOver, setDragOver] = useState(false)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [hasFiles, setHasFiles] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setDragOver(false)
    const newFiles = e.dataTransfer.files
    const filesArray = Array.from(newFiles)

    const validFiles = filesArray.filter((file) => {
      if (accept) {
        const fileExtension = file.name.split(".").pop()
        return accept.includes(`.${fileExtension}`)
      }
      return true
    })
    if (onChangeFiles) {
      onChangeFiles(validFiles)
      return
    }
    const dataTransfer = new DataTransfer()
    if (multiple) {
      validFiles.forEach((file) => {
        dataTransfer.items.add(file)
      })
    } else {
      dataTransfer.items.add(validFiles[0])
      validFiles.splice(1)
    }
    inputRef.current!.files = dataTransfer.files
    setFileNames(validFiles.map((file) => file.name))
    setHasFiles(validFiles.length > 0)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files
    if (newFiles) {
      const filesArray = Array.from(newFiles)
      if (onChangeFiles) {
        onChangeFiles(filesArray)
        return
      }
      inputRef.current!.files = newFiles

      setFileNames(filesArray.map((file) => file.name))
      setHasFiles(filesArray.length > 0)
    }
  }

  useEffect(() => {
    if (files) {
      const fileNamesArray = files.map((file) => file.name)
      setFileNames(fileNamesArray)
      setHasFiles(fileNamesArray.length > 0)
      const dataTransfer = new DataTransfer()
      if (files.length === 0) {
        inputRef.current!.files = dataTransfer.files
        return
      }
      if (multiple) {
        files.forEach((file) => {
          dataTransfer.items.add(file)
        })
      } else {
        dataTransfer.items.add(files[0])
        files.splice(1)
      }
      inputRef.current!.files = dataTransfer.files
    }
  }, [files, multiple])

  return {
    dragOver,
    fileNames,
    hasFiles,
    inputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onChange
  }
}
