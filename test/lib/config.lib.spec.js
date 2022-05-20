import path from 'path'

const configObject = {
  beforeSetupWorkers: () => {},
  setupWorkerEnvironment: () => {},
  prepareTest: () => {},
  beforeNextRun: () => {},
  runTest: () => {},
  stopTest: () => {}
}

describe('Test loadConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should resolve path and import the config file', async () => {
    const { loadConfig } = await import('../../lib/config.js')

    const mockModule = 'fastter.conf.js'
    const virtualModuleRequired = jest.fn()
    jest.doMock(mockModule, () => {
      virtualModuleRequired()
      return configObject
    }, { virtual: true })
    const spyPathResolve = jest.spyOn(path, 'resolve').mockReturnValueOnce(mockModule)
    const configPath = './fastter.conf.js'

    await loadConfig(configPath)

    expect(spyPathResolve).toHaveBeenCalledWith(configPath)
    expect(virtualModuleRequired).toHaveBeenCalled()
  })

  it('should not the resolve path and import the config file if has been already loaded', async () => {
    const { loadConfig } = await import('../../lib/config.js')

    const mockModule = 'fastter.conf.js'
    const virtualModuleRequired = jest.fn()
    jest.doMock(mockModule, () => {
      virtualModuleRequired()
      return configObject
    }, { virtual: true })
    const spyPathResolve = jest.spyOn(path, 'resolve')
    const configPath = './fastter.conf.js'

    spyPathResolve.mockReturnValueOnce(mockModule)
    await loadConfig(configPath)

    spyPathResolve.mockReturnValueOnce(mockModule)
    await loadConfig(configPath)

    expect(spyPathResolve).toHaveBeenCalledTimes(1)
    expect(virtualModuleRequired).toHaveBeenCalledTimes(1)
  })

  it('should return config object with config file implementations', async () => {
    const { loadConfig } = await import('../../lib/config.js')

    const mockModule = 'fastter.conf.js'
    jest.doMock(mockModule, () => configObject, { virtual: true })
    jest.spyOn(path, 'resolve').mockReturnValueOnce(mockModule)
    const configPath = './fastter.conf.js'
    const loadedConfig = await loadConfig(configPath)

    Object.keys(configObject).forEach(configKey => {
      expect(loadedConfig[configKey]).toBe(configObject[configKey])
    })
  })
})
