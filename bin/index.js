#! /usr/bin/env node
import cluster from 'cluster'
import { setupCluster } from '../index.js'
import { loadOptions } from '../lib/options.js'
import { initMaster } from '../lib/master/index.js'

setupCluster()

if (cluster.isMaster) {
  const options = loadOptions()
  initMaster(options)
} else if (cluster.isWorker) {
  console.log('?')
}
