'use strict'
import cluster from 'cluster'

import messages from './messages/index.js'
import Errors from './lib/errors.js'

const { MASTER_ERRORS, WORKER_ERRORS } = Errors

const runMasterMessage = (worker, msg) => {
  const { message, data } = msg
  const exec = messages.MASTER_MESSAGES_RUN[message]
  if (!exec) throw new Error(MASTER_ERRORS.NO_MESSAGE(message))
  exec(worker, data)
}

const runWorkerMessage = (msg) => {
  const worker = cluster.worker
  const { message, data } = msg
  const exec = messages.WORKER_MESSAGES_RUN[message]
  if (!exec) throw new Error(WORKER_ERRORS.NO_MESSAGE(message))
  exec(worker, data)
}

const setupCluster = () => {
  // Manage messages in master and workers
  if (cluster.isMaster) {
    cluster.on('message', runMasterMessage)
  } else if (cluster.isWorker) {
    const worker = cluster.worker
    worker.on('message', runWorkerMessage)
  }
}

export default { runMasterMessage, runWorkerMessage, setupCluster }
