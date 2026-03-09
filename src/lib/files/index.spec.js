import { MASTER_ERRORS } from '../errors.js'

describe('Test collectFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should throw an error if collectFiles param is an empty array', async () => {
    vi.doMock('./lookupFiles.js', () => ({
      lookupFiles: () => []
    }))
    const { collectFiles } = await import('./index.js')

    expect(() => collectFiles([])).toThrow(new Error(MASTER_ERRORS.NO_LOOKUPS))
  })

  it('should throw an error if collectFiles has already any file loaded', async () => {
    vi.doMock('./lookupFiles.js', () => ({
      lookupFiles: () => ['index.spec.js']
    }))
    const { collectFiles } = await import('./index.js')

    collectFiles(['index.spec.js'])
    expect(() => collectFiles(['index.spec.js'])).toThrow(new Error(MASTER_ERRORS.FILES_ALREADY_COLLECTED))
  })

  it('should call lookupFiles for each lookup in param', async () => {
    const mockLookupFiles = vi.fn()
    vi.doMock('./lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles } = await import('./index.js')

    collectFiles(['*.spec.js', '*.integration.js'])
    expect(mockLookupFiles).toHaveBeenCalledTimes(2)
  })

  it('should return an array with all looked up files', async () => {
    const lookupFilesReturn = ['index.spec.js', 'index.integration.js']
    const mockLookupFiles = vi.fn(() => lookupFilesReturn)
    vi.doMock('./lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles } = await import('./index.js')

    const collectedFiles = collectFiles(['*.spec.js', '*.integration.js'])
    const expectedFiles = [...lookupFilesReturn, ...lookupFilesReturn]
    expect(collectedFiles).toStrictEqual(expectedFiles)
  })
})

describe('Test getNextFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return the next file to run', async () => {
    const lookupFilesReturn = ['index.spec.js', 'index.integration.js']
    const mockLookupFiles = vi.fn(() => lookupFilesReturn)
    vi.doMock('./lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles, getNextFile } = await import('./index.js')

    collectFiles(['*.spec.js'])

    const nextFile1 = getNextFile()
    const nextFile2 = getNextFile()
    expect(nextFile1).toBe(lookupFilesReturn[0])
    expect(nextFile2).toBe(lookupFilesReturn[1])
  })
})

describe('Test getTotalFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return the length of files', async () => {
    const lookupFilesReturn = ['index.spec.js', 'index.integration.js']
    const mockLookupFiles = vi.fn(() => lookupFilesReturn)
    vi.doMock('./lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles, getTotalFiles } = await import('./index.js')

    collectFiles(['*.spec.js'])
    const totalFiles = getTotalFiles()

    expect(totalFiles).toBe(lookupFilesReturn.length)
  })
})
