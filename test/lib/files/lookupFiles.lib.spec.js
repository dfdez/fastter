import { MASTER_ERRORS } from '../../../lib/errors.js'

describe('Test lookupFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should exec glob and return search if lookup is a regular expression', async () => {
    const mockGlobSync = jest.fn(() => ['index.spec.js'])
    jest.doMock('glob', () => {
      const glob = jest.requireActual('glob')
      return { ...glob, sync: mockGlobSync }
    })
    const { lookupFiles } = await import('../../../lib/files/lookupFiles.js')
    const lookup = '*.spec.js'
    lookupFiles(lookup)

    expect(mockGlobSync).toHaveBeenCalledWith(lookup, { nodir: true })
  })

  it('should throw an error if glob result is empty', async () => {
    const mockGlobSync = jest.fn(() => [])
    jest.doMock('glob', () => {
      const glob = jest.requireActual('glob')
      return { ...glob, sync: mockGlobSync }
    })
    const { lookupFiles } = await import('../../../lib/files/lookupFiles.js')

    const lookup = '*.fail.js'
    expect(() => lookupFiles(lookup)).toThrow(new Error(MASTER_ERRORS.NO_GLOB_RESULT(lookup)))
  })

  it('should return the lookup if is a file', async () => {
    jest.doMock('fs', () => {
      const fs = jest.requireActual('fs')
      return {
        ...fs,
        statSync: () => ({
          isFile: () => true
        })
      }
    })
    const { lookupFiles } = await import('../../../lib/files/lookupFiles.js')

    const lookup = 'index.fail.js'
    const lookedUpFiles = lookupFiles(lookup)
    expect(lookedUpFiles).toBe(lookup)
  })

  it('should return an array with all files if lookup is a directory', async () => {
    const lookup = 'tests/'
    const readdirSyncMock = ['index.spec.js', 'index.integration.js']
    jest.doMock('fs', () => {
      const fs = jest.requireActual('fs')
      return {
        ...fs,
        statSync: (param) => ({
          isFile: () => param !== lookup,
          isDirectory: () => param === lookup
        }),
        readdirSync: () => readdirSyncMock
      }
    })
    const { lookupFiles } = await import('../../../lib/files/lookupFiles.js')

    const lookedUpFiles = lookupFiles(lookup)
    expect(lookedUpFiles).toStrictEqual([`${lookup}index.spec.js`, `${lookup}index.integration.js`])
  })

  it('should lookup in directories recursively and return array with all files', async () => {
    const lookup = 'tests/'
    const directory = 'lib/'
    const readdirSyncMock1 = [directory, 'index.spec.js']
    const readdirSyncMock2 = ['options.spec.js']

    const lookupDirectory = `${lookup}${directory}`
    jest.doMock('fs', () => {
      const fs = jest.requireActual('fs')
      return {
        ...fs,
        statSync: (param) => ({
          isFile: () => param !== lookup && param !== lookupDirectory,
          isDirectory: () => param === lookup || param === lookupDirectory
        }),
        readdirSync: (param) => param === lookup ? readdirSyncMock1 : readdirSyncMock2
      }
    })
    const { lookupFiles } = await import('../../../lib/files/lookupFiles.js')

    const lookedUpFiles = lookupFiles(lookup)
    expect(lookedUpFiles).toStrictEqual([`${lookupDirectory}options.spec.js`, `${lookup}index.spec.js`])
  })
})
