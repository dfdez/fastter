#! /usr/bin/env node
import cluster from 'cluster'
import Fastter from '../index.js'
import Options from '../lib/options.js'
import Master from '../lib/master/index.js'

Fastter.setupCluster()

if (cluster.isMaster) {
  const options = Options.loadOptions()
  Master.initMaster(options)
} else if (cluster.isWorker) {
  console.log('?')
}
