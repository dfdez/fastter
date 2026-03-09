import { lookupFiles } from './lookupFiles.js'
import { MASTER_ERRORS } from '../errors.js'

const files = []

const collectFiles = (lookups) => {
  if (!lookups.length) throw new Error(MASTER_ERRORS.NO_LOOKUPS)
  if (files.length) throw new Error(MASTER_ERRORS.FILES_ALREADY_COLLECTED)
  lookups.forEach((lookup) => {
    const lookedFiles = lookupFiles(lookup)
    if (Array.isArray(lookedFiles)) files.push(...lookedFiles)
    else files.push(lookedFiles)
  })
  return files
}

let filePosition = 0

const getNextFile = () => {
  const nextFile = files[filePosition]
  if (nextFile) filePosition++
  return nextFile
}

const getTotalFiles = () => {
  return files.length
}

export { collectFiles, getNextFile, getTotalFiles }
