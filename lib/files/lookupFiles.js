const { glob } = require('glob')
const fs = require('fs')
const path = require('path')

/**
 * @param {String} lookup Regular expression/file/directory too lookup
 * @returns Path or array of paths
 */
const lookupFiles = (lookup) => {
  if (glob.hasMagic(lookup)) return glob.sync(lookup, { nodir: true })

  // Handle file
  let stat = fs.statSync(lookup)
  if (stat.isFile()) {
    return lookup
  }

  const files = []
  // Handle directory
  fs.readdirSync(lookup).forEach(dirent => {
    const pathname = path.join(lookup, dirent)
    let stat = fs.statSync(pathname)
    if (stat.isDirectory()) {
      return files.push(...lookupFiles(pathname))
    } else if (stat.isFile()) return files.push(pathname)
  })
  return files
}

module.exports = { lookupFiles }
