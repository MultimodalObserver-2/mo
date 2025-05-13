import { useEffect, useRef, useState } from "react"

export default function useUpload(
  accept?: string[],
  multiple = false,
  files?: File[],
  onChangeFiles?: (files: File[]) => void
) {
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
