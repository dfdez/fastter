'use strict'
const cluster = require('cluster')
const { MASTER_ERRORS, WORKER_ERRORS } = require('./constants')
const { MASTER_MESSAGES_RUN, WORKER_MESSAGES_RUN } = require('./messages')

// Manage messages in master and workers
if (cluster.isMaster) {
  cluster.on('message', async (worker, msg) => {
    const { message, data } = msg
    const exec = MASTER_MESSAGES_RUN[message]
    if (!exec) return new Error(MASTER_ERRORS.NO_MESSAGE_ERROR)
    await exec(worker, data)
  })
} else if (cluster.isWorker) {
  const worker = cluster.worker
  worker.on('message', async msg => {
    const { message, data } = msg
    const exec = WORKER_MESSAGES_RUN[message]
    if (!exec) throw new Error(WORKER_ERRORS.NO_MESSAGE_ERROR)
    await exec(worker, data)
  })
}
