const { lookupFiles } = require('./lookupFiles.js')

let files = []
/**
 * @param {Object} lookups Array of regular expression/file/directory too lookup
 * @returns An array with all the files
 */
const collectFiles = (lookups) => {
  lookups.forEach(lookup => {
    const lookedFiles = lookupFiles(lookup)
    if (Array.isArray(lookedFiles)) files.push(...lookedFiles)
    else files.push(lookedFiles)
  })
  return files
}

let filePosition = 0
/**
 * @returns The next file in files list
 */
const getNextFile = () => {
  const nextFile = files[filePosition]
  if (nextFile) filePosition++
  return nextFile
}

const getTotalFiles = () => {
  return files.length
}

module.exports = { collectFiles, getNextFile, getTotalFiles }
