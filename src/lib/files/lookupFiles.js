import glob from 'glob'
import fs from 'fs'
import path from 'path'
import { MASTER_ERRORS } from '../errors.js'

const lookupFiles = (lookup) => {
  if (glob.hasMagic(lookup)) {
    const globSearch = glob.sync(lookup, { nodir: true })
    if (!globSearch.length) throw new Error(MASTER_ERRORS.NO_GLOB_RESULT(lookup))
    return globSearch
  }

  const stat = fs.statSync(lookup)
  if (stat.isFile()) {
    return lookup
  }

  const files = []
  fs.readdirSync(lookup).forEach((dir) => {
    const pathname = path.join(lookup, dir)
    const stat = fs.statSync(pathname)
    if (stat.isDirectory()) {
      return files.push(...lookupFiles(pathname))
    } else if (stat.isFile()) return files.push(pathname)
  })
  return files
}

export { lookupFiles }
