import { WORKER_MESSAGES } from '../../constants/index.js'

describe('Test initMaster', () => {
  const genericMockCluster = {
    on: vi.fn(),
    setupPrimary: vi.fn(),
    fork: vi.fn(),
    send: vi.fn(),
  }

  const genericMockLoadConfig = {
    loadConfig: vi.fn(() => ({
      beforeSetupWorkers: vi.fn(),
      setupWorkerEnvironment: vi.fn(),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock('../logger.js', () => ({
      log: vi.fn(),
      colorize: vi.fn((_, s) => s),
    }))
  })

  it('should load config', async () => {
    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const { initMaster } = await import('./index.js')
    await initMaster()

    expect(genericMockLoadConfig.loadConfig).toHaveBeenCalled()
  })

  it('should setup primary with debug option', async () => {
    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js', _debug: true }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const { initMaster } = await import('./index.js')
    await initMaster()

    expect(genericMockCluster.setupPrimary).toHaveBeenCalledWith({ silent: !options._debug })
  })

  it('should call beforeSetupWorkers config function', async () => {
    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))

    const mockBeforeSetupWorkers = vi.fn()
    const mockLoadConfig = vi.fn(() => ({
      beforeSetupWorkers: mockBeforeSetupWorkers,
      setupWorkerEnvironment: vi.fn(),
    }))
    vi.doMock('../config.js', () => ({
      loadConfig: mockLoadConfig,
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()
    expect(mockBeforeSetupWorkers).toHaveBeenCalledWith({ options })
  })

  it('should add worker running to stats and fork cluster for each worker who is going to run', async () => {
    const mockFork = vi.fn(() => ({ send: vi.fn() }))
    const mockCluster = {
      on: vi.fn(),
      setupPrimary: vi.fn(),
      fork: mockFork,
      send: vi.fn(),
    }
    vi.doMock('cluster', () => ({ default: mockCluster }))

    const options = { _config: 'fastter.conf.js', _workers: 2 }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))

    const mockSetupWorkerEnvironment = vi.fn(() => ({ NODE_ENV: 'test' }))
    const mockLoadConfig = vi.fn(() => ({
      beforeSetupWorkers: vi.fn(),
      setupWorkerEnvironment: mockSetupWorkerEnvironment,
    }))
    vi.doMock('../config.js', () => ({
      loadConfig: mockLoadConfig,
    }))

    vi.doMock('../files/index.js', () => ({
      getNextFile: () => 'index.spec.js',
    }))

    const mockAddWorkerRunning = vi.fn()
    vi.doMock('./stats.js', () => ({
      workersStats: { workersRunning: 0 },
      addWorkerRunning: mockAddWorkerRunning,
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()

    expect(mockAddWorkerRunning).toHaveBeenCalledTimes(options._workers)
    expect(mockFork).toHaveBeenCalledTimes(options._workers)
    expect(mockSetupWorkerEnvironment).toHaveBeenCalledTimes(options._workers)
    expect(mockSetupWorkerEnvironment).toHaveBeenCalledWith({ options, worker: 0 })
    expect(mockSetupWorkerEnvironment).toHaveBeenCalledWith({ options, worker: 1 })
    expect(mockFork).toHaveBeenCalledWith(mockSetupWorkerEnvironment())
  })

  it('should send the message to prepare test to workers', async () => {
    const mockWorkerSend = vi.fn()
    const mockFork = vi.fn(() => ({ send: mockWorkerSend }))
    const mockCluster = {
      on: vi.fn(),
      setupPrimary: vi.fn(),
      fork: mockFork,
      send: vi.fn(),
    }
    vi.doMock('cluster', () => ({ default: mockCluster }))

    const options = { _config: 'fastter.conf.js', _workers: 2 }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    vi.doMock('../files/index.js', () => ({
      getNextFile: () => 'index.spec.js',
    }))

    const mockAddWorkerRunning = vi.fn()
    vi.doMock('./stats.js', () => ({
      workersStats: { workersRunning: 0 },
      addWorkerRunning: mockAddWorkerRunning,
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()

    expect(mockWorkerSend).toHaveBeenCalledTimes(options._workers)
    expect(mockWorkerSend).toHaveBeenCalledWith({
      message: WORKER_MESSAGES.PREPARE_TESTS,
      data: { options },
    })
  })

  it('should add exit events', async () => {
    const spyProcessOn = vi.spyOn(process, 'on')

    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const { initMaster } = await import('./index.js')
    await initMaster()

    expect(spyProcessOn).toHaveBeenCalledWith('SIGTERM', expect.anything())
    expect(spyProcessOn).toHaveBeenCalledWith('SIGINT', expect.anything())
    expect(genericMockCluster.on).toHaveBeenCalledWith('exit', expect.anything())
  })

  it('should log worker stats and exit process in SIGTERM', async () => {
    const spyProcessOn = vi.spyOn(process, 'on')
    const spyProcessExit = vi.spyOn(process, 'exit').mockReturnValue()

    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = vi.fn()
    vi.doMock('./stats.js', () => ({
      workersStats: { workersRunning: 0 },
      logWorkerStats: mockLogWorkerStats,
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()

    const onSigTermCallFunction = spyProcessOn.mock.calls.find((call) => call[0] === 'SIGTERM')[1]

    onSigTermCallFunction()
    expect(mockLogWorkerStats).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledWith(1)
  })

  it('should log worker stats and exit process in SIGINT', async () => {
    const spyProcessOn = vi.spyOn(process, 'on')
    const spyProcessExit = vi.spyOn(process, 'exit').mockReturnValue()

    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = vi.fn()
    vi.doMock('./stats.js', () => ({
      workersStats: { workersRunning: 0 },
      logWorkerStats: mockLogWorkerStats,
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()

    const onSigIntCallFunction = spyProcessOn.mock.calls.find((call) => call[0] === 'SIGINT')[1]

    onSigIntCallFunction()
    expect(mockLogWorkerStats).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledWith(1)
  })

  it("should remove worker running on worker exit and don't exit if there is more workers running", async () => {
    const spyProcessExit = vi.spyOn(process, 'exit').mockReturnValue()

    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = vi.fn()
    const mockRemoveWorkerRunning = vi.fn()
    vi.doMock('./stats.js', () => ({
      logWorkerStats: mockLogWorkerStats,
      removeWorkerRunning: mockRemoveWorkerRunning,
      workersStats: { workersRunning: 2 },
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()

    const clusterOnExitFunction = genericMockCluster.on.mock.calls.find(
      (call) => call[0] === 'exit'
    )[1]

    const exitCode = 0
    clusterOnExitFunction(null, exitCode)

    expect(mockRemoveWorkerRunning).toHaveBeenCalled()
    expect(mockLogWorkerStats).toHaveBeenCalledTimes(0)
    expect(spyProcessExit).toHaveBeenCalledTimes(0)
  })

  it('should log worker stats and exit process if all workers have finished', async () => {
    const spyProcessExit = vi.spyOn(process, 'exit').mockReturnValue()

    vi.doMock('cluster', () => ({ default: genericMockCluster }))

    const options = { _config: 'fastter.conf.js' }
    vi.doMock('../options.js', () => ({
      loadOptions: () => options,
    }))
    vi.doMock('../config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = vi.fn()
    vi.doMock('./stats.js', () => ({
      logWorkerStats: mockLogWorkerStats,
      removeWorkerRunning: vi.fn(),
      workersStats: { workersRunning: 0 },
    }))

    const { initMaster } = await import('./index.js')
    await initMaster()

    const clusterOnExitFunction = genericMockCluster.on.mock.calls.find(
      (call) => call[0] === 'exit'
    )[1]

    const exitCode = 0
    clusterOnExitFunction(null, exitCode)

    expect(mockLogWorkerStats).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledWith(exitCode)
  })
})
