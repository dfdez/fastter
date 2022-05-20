import cluster from 'cluster'
import { MASTER_MESSAGES, WORKER_MESSAGES } from '../constants'
import { MASTER_ERRORS, WORKER_ERRORS } from '../lib/errors.js'
import { MASTER_MESSAGES_RUN, WORKER_MESSAGES_RUN } from '../messages'
import { setupCluster, runMasterMessage, runWorkerMessage } from '../index.js'

describe('Test runMasterMessage', () => {
  it('runMasterMessage should throw an error if message to execute is not defined', () => {
    expect(() => runMasterMessage(null, {})).toThrow(new Error(MASTER_ERRORS.NO_MESSAGE()))
  })

  it('runMasterMessage should execute with worker and data if message is defined', () => {
    const sendLogMessage = MASTER_MESSAGES.SEND_LOG
    const spySendLog = jest.spyOn(MASTER_MESSAGES_RUN, sendLogMessage).mockReturnValue()
    const worker = 'worker'
    const data = { message: 'Test message' }
    runMasterMessage(worker, { message: sendLogMessage, data })
    expect(spySendLog).toHaveBeenCalledWith(worker, data)
  })
})

describe('Test runWorkerMessage', () => {
  it('runWorkerMessage should throw an error if message to execute is not defined', () => {
    expect(() => runWorkerMessage({})).toThrow(new Error(WORKER_ERRORS.NO_MESSAGE()))
  })

  it('runWorkerMessage should execute with worker and data if message is defined', () => {
    const testMessage = WORKER_MESSAGES.RUN_TEST
    const spyRunTest = jest.spyOn(WORKER_MESSAGES_RUN, testMessage).mockReturnValue()
    const data = { options: {} }
    runWorkerMessage({ message: WORKER_MESSAGES.RUN_TEST, data })
    expect(spyRunTest).toHaveBeenCalledWith(undefined, data)
  })
})

describe('Test setupCluster', () => {
  it('setupCluster should add message listener in master', () => {
    const spyClusterOn = jest.spyOn(cluster, 'on')
    setupCluster()
    expect(cluster.isMaster).toBe(true)
    expect(spyClusterOn).toHaveBeenCalledWith('message', runMasterMessage)
  })

  it('setupCluster should add message listener in worker', async () => {
    jest.resetModules()
    const worker = {
      on: jest.fn()
    }
    jest.doMock('cluster', () => ({
      isMaster: false,
      isWorker: true,
      worker
    }))
    const cluster = await import('cluster')
    const { setupCluster, runWorkerMessage } = await import('../index.js')
    setupCluster()
    expect(cluster.isMaster).toBe(false)
    expect(cluster.isWorker).toBe(true)
    expect(worker.on).toHaveBeenCalledWith('message', runWorkerMessage)
  })
})
