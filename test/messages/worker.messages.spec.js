import config from '../../lib/config.js'
import { WORKER_MESSAGES_RUN } from '../../messages'
import { MASTER_MESSAGES, WORKER_MESSAGES } from '../../constants'
import { formatError } from '../../lib/logger'

const exitAllWorkersHaveBeenCalledWith = (worker, params) => {
  const { options, error } = params
  expect(worker.send).toHaveBeenCalledWith({
    message: MASTER_MESSAGES.EXIT_ALL_WORKERS,
    data: {
      options,
      exitCode: 1,
      error: error.formatted || formatError(error),
      stats: error.stats
    }
  })
}

describe('Test prepareTest worker message function', () => {
  const spyLoadConfig = jest.spyOn(config, 'loadConfig')

  const prepareTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.PREPARE_TESTS]

  it('should call sendWorkerError if there is any error', async () => {
    const worker = {
      send: jest.fn()
    }
    const error = new Error('Error preparing test')
    spyLoadConfig.mockReturnValue({ prepareTest: () => { throw error } })
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    exitAllWorkersHaveBeenCalledWith(worker, { options, error })
  })

  it('should load config', async () => {
    const worker = {
      send: jest.fn()
    }
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
  })

  it('should execute prepare test from config', async () => {
    const worker = {
      send: jest.fn()
    }
    const mockPrepareTest = jest.fn()
    spyLoadConfig.mockReturnValue({ prepareTest: mockPrepareTest })
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockPrepareTest).toHaveBeenCalledWith({ options })
  })

  it('should execute runTest (to start run test ask for work loop)', async () => {
    const worker = {
      send: jest.fn()
    }
    const mockPrepareTest = jest.fn()
    const mockRunTest = jest.fn()
    const mockBeforeNextRun = jest.fn()
    spyLoadConfig.mockReturnValue({ prepareTest: mockPrepareTest, runTest: mockRunTest, beforeNextRun: mockBeforeNextRun })
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockPrepareTest).toHaveBeenCalledWith({ options })
    expect(mockRunTest).toHaveBeenCalledWith({ options })
    expect(mockBeforeNextRun).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({ message: MASTER_MESSAGES.ASK_FOR_WORK, data: { options } })
  })
})

describe('Test runTest worker message function', () => {
  const spyLoadConfig = jest.spyOn(config, 'loadConfig')

  const runTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]

  it('should call sendWorkerError if there is any error', async () => {
    const worker = {
      send: jest.fn()
    }
    const error = new Error('Error running test')
    spyLoadConfig.mockReturnValue({ runTest: () => { throw error } })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    exitAllWorkersHaveBeenCalledWith(worker, { options, error })
  })

  it('should load config', async () => {
    const worker = {
      send: jest.fn()
    }
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
  })

  it('should execute run test from config', async () => {
    const worker = {
      send: jest.fn()
    }
    const mockRunTest = jest.fn()
    spyLoadConfig.mockReturnValue({ runTest: mockRunTest })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockRunTest).toHaveBeenCalledWith({ options })
  })

  it('should send register count message with stats returned by run test from config', async () => {
    const worker = {
      send: jest.fn()
    }
    const stats = {
      passed: 1,
      skipped: 0,
      failures: 0
    }
    const mockRunTest = jest.fn(() => ({ stats }))
    spyLoadConfig.mockReturnValue({ runTest: mockRunTest })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockRunTest).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({ message: MASTER_MESSAGES.REGISTER_TEST_COUNT, data: { options, stats } })
  })

  it('should ask for work', async () => {
    const worker = {
      send: jest.fn()
    }
    const stats = {
      passed: 1,
      skipped: 0,
      failures: 0
    }
    const mockRunTest = jest.fn(() => ({ stats }))
    const mockBeforeNextRun = jest.fn()
    spyLoadConfig.mockReturnValue({ runTest: mockRunTest, beforeNextRun: mockBeforeNextRun })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockRunTest).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({ message: MASTER_MESSAGES.REGISTER_TEST_COUNT, data: { options, stats } })
    expect(mockBeforeNextRun).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({ message: MASTER_MESSAGES.ASK_FOR_WORK, data: { options } })
  })
})

describe('Test stopTest worker message function', () => {
  const spyLoadConfig = jest.spyOn(config, 'loadConfig')
  const spyProcessExit = jest.spyOn(process, 'exit')

  const stopWorker = WORKER_MESSAGES_RUN[WORKER_MESSAGES.STOP_WORKER]

  it('should call sendWorkerError if there is any error', async () => {
    const worker = {
      send: jest.fn()
    }
    const error = new Error('Error stopping worker')
    spyLoadConfig.mockReturnValue({ stopTest: () => { throw error } })
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    exitAllWorkersHaveBeenCalledWith(worker, { options, error })
  })

  it('should load config', async () => {
    const worker = {
      send: jest.fn()
    }
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
  })

  it('should execute stop test from config', async () => {
    const worker = {
      send: jest.fn()
    }
    const mockStopWorker = jest.fn()
    spyLoadConfig.mockReturnValue({ stopTest: mockStopWorker })
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockStopWorker).toHaveBeenCalledWith({ options })
  })

  it('should disconnect and exit properly', async () => {
    const worker = {
      send: jest.fn(),
      disconnect: jest.fn()
    }
    const mockStopWorker = jest.fn()
    spyLoadConfig.mockReturnValue({ stopTest: mockStopWorker })
    const exitCode = 1
    spyProcessExit.mockReturnValue(exitCode)
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options, exitCode })
    expect(spyLoadConfig).toHaveBeenCalledWith(options._config)
    expect(mockStopWorker).toHaveBeenCalledWith({ options, exitCode })
    expect(worker.disconnect).toHaveBeenCalled()
    expect(spyProcessExit).toHaveBeenCalledWith(exitCode)
  })
})
