import LookupFiles from './lookupFiles.js'
import Errors from '../errors.js'

const { MASTER_ERRORS } = Errors

const files = []
/**
 * @param {Object} lookups Array of regular expression/file/directory too lookup
 * @returns An array with all the files
 */
export const collectFiles = (lookups) => {
  if (!lookups.length) throw new Error(MASTER_ERRORS.NO_LOOKUPS)
  if (files.length) throw new Error(MASTER_ERRORS.FILES_ALREADY_COLLECTED)
  lookups.forEach(lookup => {
    const lookedFiles = LookupFiles.lookupFiles(lookup)
    if (Array.isArray(lookedFiles)) files.push(...lookedFiles)
    else files.push(lookedFiles)
  })
  return files
}

let filePosition = 0
/**
 * @returns The next file in files list
 */
export const getNextFile = () => {
  const nextFile = files[filePosition]
  if (nextFile) filePosition++
  return nextFile
}

export const getTotalFiles = () => {
  return files.length
}

export default { collectFiles, getNextFile, getTotalFiles }
