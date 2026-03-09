import { MASTER_MESSAGES, WORKER_MESSAGES } from '../constants/index.js'

vi.mock('../lib/logger.js', () => ({
  log: vi.fn(),
  colorize: vi.fn((_, s) => s),
  formatError: vi.fn(),
}))

vi.mock('../lib/files/index.js', () => ({
  getNextFile: vi.fn(),
  getTotalFiles: vi.fn(() => 0),
}))

vi.mock('../lib/master/stats.js', () => ({
  workersStats: { workersRunning: 0 },
  addWorkersStats: vi.fn(),
}))

vi.mock('cluster', () => ({
  default: {
    workers: {
      1: { send: vi.fn() },
    },
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Test sendLog master message function', () => {
  it('should send log to logger', async () => {
    const { log } = await import('../lib/logger.js')
    const { MASTER_MESSAGES_RUN } = await import('./master.js')
    const sendLog = MASTER_MESSAGES_RUN[MASTER_MESSAGES.SEND_LOG]

    const testMessage = 'Testing logs'
    const options = { _test: true }
    sendLog(null, { message: testMessage, options })

    expect(log).toHaveBeenCalledWith(testMessage, options)
  })
})

describe('Test askForWork master message function', () => {
  const worker = { send: vi.fn() }

  it('should send run test message to worker if there is next file', async () => {
    const { getNextFile } = await import('../lib/files/index.js')
    const { MASTER_MESSAGES_RUN } = await import('./master.js')
    const askForWork = MASTER_MESSAGES_RUN[MASTER_MESSAGES.ASK_FOR_WORK]

    vi.mocked(getNextFile).mockReturnValue('test.spec.js')
    const options = { _test: true }
    askForWork(worker, { options })

    expect(getNextFile).toHaveBeenCalled()
    expect(worker.send).toHaveBeenCalledWith({
      message: WORKER_MESSAGES.RUN_TEST,
      data: { options },
    })
  })

  it("should send stop worker message if there isn't more files to run", async () => {
    const { getNextFile } = await import('../lib/files/index.js')
    const { MASTER_MESSAGES_RUN } = await import('./master.js')
    const askForWork = MASTER_MESSAGES_RUN[MASTER_MESSAGES.ASK_FOR_WORK]

    vi.mocked(getNextFile).mockReturnValue(undefined)
    const options = { _test: true }
    askForWork(worker, { options })

    expect(getNextFile).toHaveBeenCalled()
    expect(worker.send).toHaveBeenCalledWith({
      message: WORKER_MESSAGES.STOP_WORKER,
      data: { options, exitCode: 0 },
    })
  })
})

describe('Test registerTestCount master message function', () => {
  it('should add worker stats and log status', async () => {
    const { addWorkersStats } = await import('../lib/master/stats.js')
    const { log } = await import('../lib/logger.js')
    const { MASTER_MESSAGES_RUN } = await import('./master.js')
    const registerTestCount = MASTER_MESSAGES_RUN[MASTER_MESSAGES.REGISTER_TEST_COUNT]

    const stats = { passes: 1 }
    const options = { _test: true }
    registerTestCount(null, { options, stats })

    expect(addWorkersStats).toHaveBeenCalledWith(stats)
    expect(log).toHaveBeenCalled()
  })
})

describe('Test exitAllWorkers master message function', () => {
  it("should exit all workers and don't do nothing if already called", async () => {
    const { addWorkersStats } = await import('../lib/master/stats.js')
    const { log } = await import('../lib/logger.js')
    const cluster = await import('cluster')
    const mockSendMessage = cluster.default.workers[1].send
    const { MASTER_MESSAGES_RUN } = await import('./master.js')
    const exitAllWorkers = MASTER_MESSAGES_RUN[MASTER_MESSAGES.EXIT_ALL_WORKERS]

    const params = {
      stats: { passes: 1 },
      options: { _test: true },
      exitCode: 1,
      error: ['Test error'],
    }
    exitAllWorkers(null, params)

    expect(addWorkersStats).toHaveBeenCalledWith(params.stats)
    expect(log).toHaveBeenCalledWith(params.error)
    expect(mockSendMessage).toHaveBeenCalledWith({
      message: WORKER_MESSAGES.STOP_WORKER,
      data: { options: params.options, exitCode: params.exitCode },
    })

    exitAllWorkers(null, {})

    expect(addWorkersStats).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledTimes(1)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })
})
