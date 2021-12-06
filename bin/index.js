#! /usr/bin/env node
import cluster from 'cluster'
import Fastter from '../index.js'
import Options from '../lib/options.js'
import Master from '../lib/master/index.js'
import constants from '../constants/index.js'

const { MASTER_MESSAGES } = constants

Fastter.setupCluster()

if (cluster.isMaster) {
  const options = Options.loadOptions()
  Master.initMaster(options)
} else if (cluster.isWorker) {
  const worker = cluster.worker
  worker.send({ message: MASTER_MESSAGES.WORKER_READY })
}
