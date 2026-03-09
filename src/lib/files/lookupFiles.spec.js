import { MASTER_ERRORS } from '../errors.js'

describe('Test lookupFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should exec glob and return search if lookup is a regular expression', async () => {
    const mockGlobSync = vi.fn(() => ['index.spec.js'])
    vi.doMock('glob', async () => {
      const glob = await vi.importActual('glob')
      return { default: { ...glob.default, sync: mockGlobSync } }
    })
    const { lookupFiles } = await import('./lookupFiles.js')
    const lookup = '*.spec.js'
    lookupFiles(lookup)

    expect(mockGlobSync).toHaveBeenCalledWith(lookup, { nodir: true })
  })

  it('should throw an error if glob result is empty', async () => {
    const mockGlobSync = vi.fn(() => [])
    vi.doMock('glob', async () => {
      const glob = await vi.importActual('glob')
      return { default: { ...glob.default, sync: mockGlobSync } }
    })
    const { lookupFiles } = await import('./lookupFiles.js')

    const lookup = '*.fail.js'
    expect(() => lookupFiles(lookup)).toThrow(new Error(MASTER_ERRORS.NO_GLOB_RESULT(lookup)))
  })

  it('should return the lookup if is a file', async () => {
    vi.doMock('fs', async () => {
      const fs = await vi.importActual('fs')
      return {
        default: {
          ...fs.default,
          statSync: () => ({
            isFile: () => true,
          }),
        },
      }
    })
    const { lookupFiles } = await import('./lookupFiles.js')

    const lookup = 'index.fail.js'
    const lookedUpFiles = lookupFiles(lookup)
    expect(lookedUpFiles).toBe(lookup)
  })

  it('should return an array with all files if lookup is a directory', async () => {
    const lookup = 'tests/'
    const readdirSyncMock = ['index.spec.js', 'index.integration.js']
    vi.doMock('fs', async () => {
      const fs = await vi.importActual('fs')
      return {
        default: {
          ...fs.default,
          statSync: (param) => ({
            isFile: () => param !== lookup,
            isDirectory: () => param === lookup,
          }),
          readdirSync: () => readdirSyncMock,
        },
      }
    })
    const { lookupFiles } = await import('./lookupFiles.js')

    const lookedUpFiles = lookupFiles(lookup)
    expect(lookedUpFiles).toStrictEqual([`${lookup}index.spec.js`, `${lookup}index.integration.js`])
  })

  it('should lookup in directories recursively and return array with all files', async () => {
    const lookup = 'tests/'
    const directory = 'lib/'
    const readdirSyncMock1 = [directory, 'index.spec.js']
    const readdirSyncMock2 = ['options.spec.js']

    const lookupDirectory = `${lookup}${directory}`
    vi.doMock('fs', async () => {
      const fs = await vi.importActual('fs')
      return {
        default: {
          ...fs.default,
          statSync: (param) => ({
            isFile: () => param !== lookup && param !== lookupDirectory,
            isDirectory: () => param === lookup || param === lookupDirectory,
          }),
          readdirSync: (param) => (param === lookup ? readdirSyncMock1 : readdirSyncMock2),
        },
      }
    })
    const { lookupFiles } = await import('./lookupFiles.js')

    const lookedUpFiles = lookupFiles(lookup)
    expect(lookedUpFiles).toStrictEqual([
      `${lookupDirectory}options.spec.js`,
      `${lookup}index.spec.js`,
    ])
  })
})
