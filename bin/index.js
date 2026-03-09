#! /usr/bin/env node
import cluster from 'cluster'
import { setupCluster } from '../src/index.js'
import { loadOptions } from '../src/lib/options.js'
import { initMaster } from '../src/lib/master/index.js'

setupCluster()

if (cluster.isPrimary) {
  const options = loadOptions()
  initMaster(options)
}
