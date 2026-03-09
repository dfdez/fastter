import path from 'path'

const configObject = {
  beforeSetupWorkers: () => {},
  setupWorkerEnvironment: () => {},
  prepareTest: () => {},
  beforeNextRun: () => {},
  runTest: () => {},
  stopTest: () => {},
}

describe('Test loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should resolve path and load the config file', async () => {
    const { loadConfig } = await import('./config.js')

    const mockLoader = vi.fn(() => configObject)
    const spyPathResolve = vi.spyOn(path, 'resolve')
    const configPath = './fastter.conf.js'

    loadConfig(configPath, mockLoader)

    expect(spyPathResolve).toHaveBeenCalledWith(configPath)
    expect(mockLoader).toHaveBeenCalled()
  })

  it('should not resolve path and load the config file if has been already loaded', async () => {
    const { loadConfig } = await import('./config.js')

    const mockLoader = vi.fn(() => configObject)
    const spyPathResolve = vi.spyOn(path, 'resolve')
    const configPath = './fastter.conf.js'

    loadConfig(configPath, mockLoader)
    loadConfig(configPath, mockLoader)

    expect(spyPathResolve).toHaveBeenCalledTimes(1)
    expect(mockLoader).toHaveBeenCalledTimes(1)
  })

  it('should return config object with config file implementations', async () => {
    const { loadConfig } = await import('./config.js')

    const mockLoader = vi.fn(() => configObject)
    const configPath = './fastter.conf.js'
    const loadedConfig = loadConfig(configPath, mockLoader)

    Object.keys(configObject).forEach((configKey) => {
      expect(loadedConfig[configKey]).toBe(configObject[configKey])
    })
  })
})
