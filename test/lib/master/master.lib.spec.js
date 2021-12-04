const { WORKER_MESSAGES } = require('../../../constants/index.js')

describe('Test initMaster', () => {
  const genericMockCluster = {
    on: jest.fn(),
    setupMaster: jest.fn(),
    fork: jest.fn(),
    send: jest.fn()
  }

  const genericMockLoadConfig = {
    loadConfig: jest.fn(() => ({
      beforeSetupWorkers: jest.fn(),
      setupWorkerEnvironment: jest.fn()
    }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    jest.doMock('../../../lib/logger.js', () => ({
      log: jest.fn()
    }))
  })

  it('should load config', async () => {
    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    expect(genericMockLoadConfig.loadConfig).toHaveBeenCalled()
  })

  it('should setup master with debug option', async () => {
    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js',
      _debug: true
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    expect(genericMockCluster.setupMaster).toHaveBeenCalledWith({ silent: !options._debug })
  })

  it('should call beforeSetupWorkers config function', async () => {
    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    const mockBeforeSetupWorkers = jest.fn()
    const mockLoadConfig = jest.fn(() => ({
      beforeSetupWorkers: mockBeforeSetupWorkers,
      setupWorkerEnvironment: jest.fn()
    }))
    jest.doMock('../../../lib/config.js', () => ({
      loadConfig: mockLoadConfig
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()
    expect(mockBeforeSetupWorkers).toHaveBeenCalledWith({ options })
  })

  it('should add worker running to stats and fork cluster for each worker who is going to run', async () => {
    const mockFork = jest.fn(() => ({
      send: jest.fn()
    }))
    const mockCluster = {
      on: jest.fn(),
      setupMaster: jest.fn(),
      fork: mockFork,
      send: jest.fn()
    }
    jest.doMock('cluster', () => mockCluster)

    const options = {
      _config: 'fastter.conf.js',
      _workers: 2
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    const mockSetupWorkerEnvironment = jest.fn(() => ({ NODE_ENV: 'test' }))
    const mockLoadConfig = jest.fn(() => ({
      beforeSetupWorkers: jest.fn(),
      setupWorkerEnvironment: mockSetupWorkerEnvironment
    }))
    jest.doMock('../../../lib/config.js', () => ({
      loadConfig: mockLoadConfig
    }))

    jest.doMock('../../../lib/files/index.js', () => ({
      getNextFile: () => 'index.spec.js'
    }))

    const mockAddWorkerRunning = jest.fn()
    jest.doMock('../../../lib/master/stats.js', () => ({
      addWorkerRunning: mockAddWorkerRunning
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    expect(mockAddWorkerRunning).toHaveBeenCalledTimes(options._workers)
    expect(mockFork).toHaveBeenCalledTimes(options._workers)
    expect(mockSetupWorkerEnvironment).toHaveBeenCalledTimes(options._workers)
    expect(mockSetupWorkerEnvironment).toHaveBeenCalledWith({ options, worker: 0 })
    expect(mockSetupWorkerEnvironment).toHaveBeenCalledWith({ options, worker: 1 })
    expect(mockFork).toHaveBeenCalledWith(mockSetupWorkerEnvironment())
  })

  it('should send the message to prepare test to workers', async () => {
    const mockWorkerSend = jest.fn()
    const mockFork = jest.fn(() => ({
      send: mockWorkerSend
    }))
    const mockCluster = {
      on: jest.fn(),
      setupMaster: jest.fn(),
      fork: mockFork,
      send: jest.fn()
    }
    jest.doMock('cluster', () => mockCluster)

    const options = {
      _config: 'fastter.conf.js',
      _workers: 2
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    jest.doMock('../../../lib/files/index.js', () => ({
      getNextFile: () => 'index.spec.js'
    }))

    const mockAddWorkerRunning = jest.fn()
    jest.doMock('../../../lib/master/stats.js', () => ({
      addWorkerRunning: mockAddWorkerRunning
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    expect(mockWorkerSend).toHaveBeenCalledTimes(options._workers)
    expect(mockWorkerSend).toHaveBeenCalledWith({ message: WORKER_MESSAGES.PREPARE_TESTS, data: { options } })
  })

  it('should add exit events', async () => {
    const spyProcessOn = jest.spyOn(process, 'on')

    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    expect(spyProcessOn).toHaveBeenCalledWith('SIGTERM', expect.anything())
    expect(spyProcessOn).toHaveBeenCalledWith('SIGINT', expect.anything())
    expect(genericMockCluster.on).toHaveBeenCalledWith('exit', expect.anything())
  })

  it('should log worker stats and exit process in SIGTERM', async () => {
    const spyProcessOn = jest.spyOn(process, 'on')
    const spyProcessExit = jest.spyOn(process, 'exit').mockReturnValue()

    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = jest.fn()
    jest.doMock('../../../lib/master/stats.js', () => ({
      logWorkerStats: mockLogWorkerStats
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    const onSigTermCallFunction = spyProcessOn.mock.calls.find(call => call[0] === 'SIGTERM')[1]

    onSigTermCallFunction()
    expect(mockLogWorkerStats).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledWith(1)
  })

  it('should log worker stats and exit process in SIGINT', async () => {
    const spyProcessOn = jest.spyOn(process, 'on')
    const spyProcessExit = jest.spyOn(process, 'exit').mockReturnValue()

    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = jest.fn()
    jest.doMock('../../../lib/master/stats.js', () => ({
      logWorkerStats: mockLogWorkerStats
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    const onSigIntCallFunction = spyProcessOn.mock.calls.find(call => call[0] === 'SIGINT')[1]

    onSigIntCallFunction()
    expect(mockLogWorkerStats).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledWith(1)
  })

  it('should remove worker running on worker exit and don\'t exit if there is more workers running', async () => {
    const spyProcessExit = jest.spyOn(process, 'exit').mockReturnValue()

    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = jest.fn()
    const mockRemoveWorkerRunning = jest.fn()
    jest.doMock('../../../lib/master/stats.js', () => ({
      logWorkerStats: mockLogWorkerStats,
      removeWorkerRunning: mockRemoveWorkerRunning,
      workersStats: {
        workersRunning: 2
      }
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    const clusterOnExitFunction = genericMockCluster.on.mock.calls.find(call => call[0] === 'exit')[1]

    const exitCode = 0
    clusterOnExitFunction(null, exitCode)

    expect(mockRemoveWorkerRunning).toHaveBeenCalled()
    expect(mockLogWorkerStats).toHaveBeenCalledTimes(0)
    expect(spyProcessExit).toHaveBeenCalledTimes(0)
  })

  it('should log worker stats and exit process if all workers have finished', async () => {
    const spyProcessExit = jest.spyOn(process, 'exit').mockReturnValue()

    jest.doMock('cluster', () => genericMockCluster)

    const options = {
      _config: 'fastter.conf.js'
    }
    jest.doMock('../../../lib/options.js', () => ({
      loadOptions: () => options
    }))

    jest.doMock('../../../lib/config.js', () => genericMockLoadConfig)

    const mockLogWorkerStats = jest.fn()
    jest.doMock('../../../lib/master/stats.js', () => ({
      logWorkerStats: mockLogWorkerStats,
      removeWorkerRunning: jest.fn(),
      workersStats: {
        workersRunning: 0
      }
    }))

    const { initMaster } = require('../../../lib/master/index.js')
    await initMaster()

    const clusterOnExitFunction = genericMockCluster.on.mock.calls.find(call => call[0] === 'exit')[1]

    const exitCode = 0
    clusterOnExitFunction(null, exitCode)

    expect(mockLogWorkerStats).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledTimes(1)
    expect(spyProcessExit).toHaveBeenCalledWith(exitCode)
  })
})
