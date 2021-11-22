'use strict'
const cluster = require('cluster')
const { MASTER_ERRORS, WORKER_ERRORS } = require('./lib/errors.js')
const { MASTER_MESSAGES_RUN, WORKER_MESSAGES_RUN } = require('./messages')

const runMasterMessage = (worker, msg) => {
  const { message, data } = msg
  const exec = MASTER_MESSAGES_RUN[message]
  if (!exec) throw new Error(MASTER_ERRORS.NO_MESSAGE(message))
  exec(worker, data)
}

const runWorkerMessage = (msg) => {
  const worker = cluster.worker
  const { message, data } = msg
  const exec = WORKER_MESSAGES_RUN[message]
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

module.exports = { runMasterMessage, runWorkerMessage, setupCluster }