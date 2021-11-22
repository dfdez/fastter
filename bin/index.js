#! /usr/bin/env node
const cluster = require('cluster')
const { setupCluster } = require('../index.js')
const { loadOptions } = require('../lib/options.js')
const { initMaster } = require('../lib/master/index.js')

setupCluster()

if (cluster.isMaster) {
  const options = loadOptions()
  initMaster(options)
}
