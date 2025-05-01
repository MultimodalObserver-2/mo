export default function useDraggable(
  onDropItem: (index: number) => void,
  dragClassName = "dragging",
  dragOverTopClassName = "drag-over-top",
  dragOverBottomClassName = "drag-over-bottom"
) {
  const getDraggedDropzoneElement = () => {
    const draggedElement = document.getElementsByClassName(dragClassName)[0]
    if (!draggedElement) {
      return null
    }
    const dropzoneElement = draggedElement.parentElement

    return dropzoneElement
  }

  const getDragEventDropzoneElement = (e: React.DragEvent<HTMLElement>) => {
    const dropzoneElement = e.currentTarget.parentElement
    if (!dropzoneElement) {
      return null
    }
    return dropzoneElement
  }

  const onDragStart = (e: React.DragEvent<HTMLElement>) => {
    e.dataTransfer.setData("text", e.currentTarget.id)
    e.currentTarget.classList.add(dragClassName)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove(dragClassName)
  }

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    if (getDraggedDropzoneElement() !== getDragEventDropzoneElement(e)) {
      return
    }
    e.preventDefault()
    e.currentTarget.classList.remove(dragClassName, dragOverTopClassName, dragOverBottomClassName)
    const draggedIdx = e.dataTransfer.getData("text")
    const targetIdx = e.currentTarget.id
    if (draggedIdx !== targetIdx) {
      onDropItem(Number(draggedIdx))
    }
  }

  const onDragEnter = (e: React.DragEvent<HTMLElement>) => {
    if (getDraggedDropzoneElement() !== getDragEventDropzoneElement(e)) {
      return
    }
    const draggedIdx = Number(document.getElementsByClassName(dragClassName)[0].id)
    const targetIdx = Number(e.currentTarget.id)
    if (draggedIdx >= targetIdx && draggedIdx != 0) {
      e.currentTarget.classList.add(dragOverTopClassName)
      e.currentTarget.classList.remove(dragOverBottomClassName)
    } else {
      e.currentTarget.classList.add(dragOverBottomClassName)
      e.currentTarget.classList.remove(dragOverTopClassName)
    }
  }

  const onDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (getDraggedDropzoneElement() !== getDragEventDropzoneElement(e)) {
      return
    }
    e.currentTarget.classList.remove(dragOverTopClassName, dragOverBottomClassName)
  }

  return {
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave
  }
}
