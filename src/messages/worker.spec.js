import { MASTER_MESSAGES, WORKER_MESSAGES } from '../constants/index.js'
import { formatError } from '../lib/logger.js'

vi.mock('../lib/logger.js', () => ({
  log: vi.fn(),
  colorize: vi.fn((_, s) => s),
  formatError: vi.fn((e) => e.message),
}))

vi.mock('../lib/config.js', () => ({
  loadConfig: vi.fn(),
}))

const exitAllWorkersHaveBeenCalledWith = (worker, params) => {
  const { options, error } = params
  expect(worker.send).toHaveBeenCalledWith({
    message: MASTER_MESSAGES.EXIT_ALL_WORKERS,
    data: {
      options,
      exitCode: 1,
      error: error.formatted || formatError(error),
      stats: error.stats,
    },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Test prepareTest worker message function', () => {
  it('should call sendWorkerError if there is any error', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const prepareTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.PREPARE_TESTS]

    const worker = { send: vi.fn() }
    const error = new Error('Error preparing test')
    vi.mocked(loadConfig).mockReturnValue({
      prepareTest: () => {
        throw error
      },
    })
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    exitAllWorkersHaveBeenCalledWith(worker, { options, error })
  })

  it('should load config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const prepareTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.PREPARE_TESTS]

    const worker = { send: vi.fn() }
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
  })

  it('should execute prepare test from config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const prepareTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.PREPARE_TESTS]

    const worker = { send: vi.fn() }
    const mockPrepareTest = vi.fn()
    vi.mocked(loadConfig).mockReturnValue({ prepareTest: mockPrepareTest })
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    expect(mockPrepareTest).toHaveBeenCalledWith({ options })
  })

  it('should execute runTest (to start run test ask for work loop)', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const prepareTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.PREPARE_TESTS]

    const worker = { send: vi.fn() }
    const mockPrepareTest = vi.fn()
    const mockRunTest = vi.fn()
    const mockBeforeNextRun = vi.fn()
    vi.mocked(loadConfig).mockReturnValue({
      prepareTest: mockPrepareTest,
      runTest: mockRunTest,
      beforeNextRun: mockBeforeNextRun,
    })
    const options = { _config: 'fastter.conf.js' }
    await prepareTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    expect(mockPrepareTest).toHaveBeenCalledWith({ options })
    expect(mockRunTest).toHaveBeenCalledWith({ options })
    expect(mockBeforeNextRun).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({
      message: MASTER_MESSAGES.ASK_FOR_WORK,
      data: { options },
    })
  })
})

describe('Test runTest worker message function', () => {
  it('should call sendWorkerError if there is any error', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const runTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]

    const worker = { send: vi.fn() }
    const error = new Error('Error running test')
    vi.mocked(loadConfig).mockReturnValue({
      runTest: () => {
        throw error
      },
    })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    exitAllWorkersHaveBeenCalledWith(worker, { options, error })
  })

  it('should load config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const runTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]

    const worker = { send: vi.fn() }
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
  })

  it('should execute run test from config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const runTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]

    const worker = { send: vi.fn() }
    const mockRunTest = vi.fn()
    vi.mocked(loadConfig).mockReturnValue({ runTest: mockRunTest })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    expect(mockRunTest).toHaveBeenCalledWith({ options })
  })

  it('should send register count message with stats returned by run test from config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const runTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]

    const worker = { send: vi.fn() }
    const stats = { passed: 1, skipped: 0, failures: 0 }
    const mockRunTest = vi.fn(() => ({ stats }))
    vi.mocked(loadConfig).mockReturnValue({ runTest: mockRunTest })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(mockRunTest).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({
      message: MASTER_MESSAGES.REGISTER_TEST_COUNT,
      data: { options, stats },
    })
  })

  it('should ask for work', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const runTest = WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]

    const worker = { send: vi.fn() }
    const stats = { passed: 1, skipped: 0, failures: 0 }
    const mockRunTest = vi.fn(() => ({ stats }))
    const mockBeforeNextRun = vi.fn()
    vi.mocked(loadConfig).mockReturnValue({
      runTest: mockRunTest,
      beforeNextRun: mockBeforeNextRun,
    })
    const options = { _config: 'fastter.conf.js' }
    await runTest(worker, { options })
    expect(mockRunTest).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({
      message: MASTER_MESSAGES.REGISTER_TEST_COUNT,
      data: { options, stats },
    })
    expect(mockBeforeNextRun).toHaveBeenCalledWith({ options })
    expect(worker.send).toHaveBeenCalledWith({
      message: MASTER_MESSAGES.ASK_FOR_WORK,
      data: { options },
    })
  })
})

describe('Test stopTest worker message function', () => {
  it('should call sendWorkerError if there is any error', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const stopWorker = WORKER_MESSAGES_RUN[WORKER_MESSAGES.STOP_WORKER]

    const worker = { send: vi.fn() }
    const error = new Error('Error stopping worker')
    vi.mocked(loadConfig).mockReturnValue({
      stopTest: () => {
        throw error
      },
    })
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    exitAllWorkersHaveBeenCalledWith(worker, { options, error })
  })

  it('should load config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const stopWorker = WORKER_MESSAGES_RUN[WORKER_MESSAGES.STOP_WORKER]

    const worker = { send: vi.fn() }
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
  })

  it('should execute stop test from config', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const stopWorker = WORKER_MESSAGES_RUN[WORKER_MESSAGES.STOP_WORKER]

    const worker = { send: vi.fn() }
    const mockStopWorker = vi.fn()
    vi.mocked(loadConfig).mockReturnValue({ stopTest: mockStopWorker })
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    expect(mockStopWorker).toHaveBeenCalledWith({ options })
  })

  it('should disconnect and exit properly', async () => {
    const { loadConfig } = await import('../lib/config.js')
    const { WORKER_MESSAGES_RUN } = await import('./worker.js')
    const stopWorker = WORKER_MESSAGES_RUN[WORKER_MESSAGES.STOP_WORKER]

    const worker = { send: vi.fn(), disconnect: vi.fn() }
    const mockStopWorker = vi.fn()
    vi.mocked(loadConfig).mockReturnValue({ stopTest: mockStopWorker })
    const exitCode = 1
    const spyProcessExit = vi.spyOn(process, 'exit').mockReturnValue()
    const options = { _config: 'fastter.conf.js' }
    await stopWorker(worker, { options, exitCode })
    expect(loadConfig).toHaveBeenCalledWith(options._config)
    expect(mockStopWorker).toHaveBeenCalledWith({ options, exitCode })
    expect(worker.disconnect).toHaveBeenCalled()
    expect(spyProcessExit).toHaveBeenCalledWith(exitCode)
  })
})
