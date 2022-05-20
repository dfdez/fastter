import { MASTER_ERRORS } from '../../../lib/errors.js'

describe('Test collectFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should throw an error if collectFiles param is an empty array', async () => {
    jest.doMock('../../../lib/files/lookupFiles.js', () => ({
      lookupFiles: () => []
    }))
    const { collectFiles } = await import('../../../lib/files/index.js')

    expect(() => collectFiles([])).toThrow(new Error(MASTER_ERRORS.NO_LOOKUPS))
  })

  it('should throw an error if collectFiles has already any file loaded', async () => {
    jest.doMock('../../../lib/files/lookupFiles.js', () => ({
      lookupFiles: () => ['index.spec.js']
    }))
    const { collectFiles } = await import('../../../lib/files/index.js')

    collectFiles(['index.spec.js'])
    expect(() => collectFiles(['index.spec.js'])).toThrow(new Error(MASTER_ERRORS.FILES_ALREADY_COLLECTED))
  })

  it('should call collectFiles for each lookup in param', async () => {
    const mockLookupFiles = jest.fn()
    jest.doMock('../../../lib/files/lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles } = await import('../../../lib/files/index.js')

    collectFiles(['*.spec.js', '*.integration.js'])
    expect(mockLookupFiles).toHaveBeenCalledTimes(2)
  })

  it('should return an array with all looked up files', async () => {
    const lookupFilesReturn = ['index.spec.js', 'index.integration.js']
    const mockLookupFiles = jest.fn(() => lookupFilesReturn)
    jest.doMock('../../../lib/files/lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles } = await import('../../../lib/files/index.js')

    const collectedFiles = collectFiles(['*.spec.js', '*.integration.js'])
    const expectedFiles = [...lookupFilesReturn, ...lookupFilesReturn]
    expect(collectedFiles).toStrictEqual(expectedFiles)
  })
})

describe('Test getNextFile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should return the next file to run', async () => {
    const lookupFilesReturn = ['index.spec.js', 'index.integration.js']
    const mockLookupFiles = jest.fn(() => lookupFilesReturn)
    jest.doMock('../../../lib/files/lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles, getNextFile } = await import('../../../lib/files/index.js')

    collectFiles(['*.spec.js'])

    const nextFile1 = getNextFile()
    const nextFile2 = getNextFile()
    expect(nextFile1).toBe(lookupFilesReturn[0])
    expect(nextFile2).toBe(lookupFilesReturn[1])
  })
})

describe('Test getTotalFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should return the length of files', async () => {
    const lookupFilesReturn = ['index.spec.js', 'index.integration.js']
    const mockLookupFiles = jest.fn(() => lookupFilesReturn)
    jest.doMock('../../../lib/files/lookupFiles.js', () => ({
      lookupFiles: mockLookupFiles
    }))
    const { collectFiles, getTotalFiles } = await import('../../../lib/files/index.js')

    collectFiles(['*.spec.js'])
    const totalFiles = getTotalFiles()

    expect(totalFiles).toBe(lookupFilesReturn.length)
  })
})
