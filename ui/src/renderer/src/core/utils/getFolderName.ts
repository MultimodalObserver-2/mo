export async function getFolderName(absPath: string, folderName: string): Promise<string> {
  let name = folderName
  let index = 1

  while (true) {
    const fullPath = `${absPath}/${name}`
    if (!(await window.core.fs.existsSync(fullPath))) {
      return name // Return the unique folder name
    }
    name = `${folderName} (${index})`
    index++
  }
}
