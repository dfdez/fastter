import { MASTER_MESSAGES, WORKER_MESSAGES } from './constants/index.js'
import { MASTER_ERRORS, WORKER_ERRORS } from './lib/errors.js'

vi.mock('./lib/logger.js', () => ({
  log: vi.fn(),
  colorize: vi.fn((_, s) => s),
  formatError: vi.fn()
}))

vi.mock('./messages/index.js', () => ({
  MASTER_MESSAGES_RUN: {
    [MASTER_MESSAGES.SEND_LOG]: vi.fn(),
    [MASTER_MESSAGES.ASK_FOR_WORK]: vi.fn(),
    [MASTER_MESSAGES.REGISTER_TEST_COUNT]: vi.fn(),
    [MASTER_MESSAGES.EXIT_ALL_WORKERS]: vi.fn()
  },
  WORKER_MESSAGES_RUN: {
    [WORKER_MESSAGES.PREPARE_TESTS]: vi.fn(),
    [WORKER_MESSAGES.RUN_TEST]: vi.fn(),
    [WORKER_MESSAGES.STOP_WORKER]: vi.fn()
  }
}))

describe('Test runMasterMessage', () => {
  it('runMasterMessage should throw an error if message to execute is not defined', async () => {
    const { runMasterMessage } = await import('./index.js')
    expect(() => runMasterMessage(null, {})).toThrow(new Error(MASTER_ERRORS.NO_MESSAGE()))
  })

  it('runMasterMessage should execute with worker and data if message is defined', async () => {
    const { MASTER_MESSAGES_RUN } = await import('./messages/index.js')
    const { runMasterMessage } = await import('./index.js')
    const sendLogMessage = MASTER_MESSAGES.SEND_LOG
    const worker = 'worker'
    const data = { message: 'Test message' }
    runMasterMessage(worker, { message: sendLogMessage, data })
    expect(MASTER_MESSAGES_RUN[sendLogMessage]).toHaveBeenCalledWith(worker, data)
  })
})

describe('Test runWorkerMessage', () => {
  it('runWorkerMessage should throw an error if message to execute is not defined', async () => {
    const { runWorkerMessage } = await import('./index.js')
    expect(() => runWorkerMessage({})).toThrow(new Error(WORKER_ERRORS.NO_MESSAGE()))
  })

  it('runWorkerMessage should execute with worker and data if message is defined', async () => {
    const { WORKER_MESSAGES_RUN } = await import('./messages/index.js')
    const { runWorkerMessage } = await import('./index.js')
    const data = { options: {} }
    runWorkerMessage({ message: WORKER_MESSAGES.RUN_TEST, data })
    expect(WORKER_MESSAGES_RUN[WORKER_MESSAGES.RUN_TEST]).toHaveBeenCalledWith(undefined, data)
  })
})

describe('Test setupCluster', () => {
  it('setupCluster should add message listener in master', async () => {
    const cluster = await import('cluster')
    const { setupCluster, runMasterMessage } = await import('./index.js')
    const spyClusterOn = vi.spyOn(cluster.default, 'on')
    setupCluster()
    expect(cluster.default.isPrimary).toBe(true)
    expect(spyClusterOn).toHaveBeenCalledWith('message', runMasterMessage)
  })

  it('setupCluster should add message listener in worker', async () => {
    vi.resetModules()
    const worker = { on: vi.fn() }
    vi.doMock('cluster', () => ({
      default: {
        isPrimary: false,
        isWorker: true,
        worker
      }
    }))
    const cluster = await import('cluster')
    const { setupCluster, runWorkerMessage } = await import('./index.js')
    setupCluster()
    expect(cluster.default.isPrimary).toBe(false)
    expect(cluster.default.isWorker).toBe(true)
    expect(worker.on).toHaveBeenCalledWith('message', runWorkerMessage)
  })
})
