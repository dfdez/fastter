const { glob } = require('glob')
const fs = require('fs')
const path = require('path')
const { MASTER_ERRORS } = require('../../constants')

/**
 * @param {String} lookup Regular expression/file/directory too lookup
 * @returns Path or array of paths
 */
const lookupFiles = (lookup) => {
  if (glob.hasMagic(lookup)) {
    const globSearch = glob.sync(lookup, { nodir: true })
    if (!globSearch.length) throw new Error(MASTER_ERRORS.NO_GLOB_RESULT(lookup))
    return globSearch
  }

  // Handle file
  const stat = fs.statSync(lookup)
  if (stat.isFile()) {
    return lookup
  }

  const files = []
  // Handle directory
  fs.readdirSync(lookup).forEach(dirent => {
    const pathname = path.join(lookup, dirent)
    const stat = fs.statSync(pathname)
    if (stat.isDirectory()) {
      return files.push(...lookupFiles(pathname))
    } else if (stat.isFile()) return files.push(pathname)
  })
  return files
}

module.exports = { lookupFiles }
