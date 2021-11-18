#! /usr/bin/env node
require('../index.js')
const cluster = require('cluster')
const { loadOptions } = require('../lib/options.js')
const { initMaster } = require('../lib/master/index.js')

if (cluster.isMaster) {
  const options = loadOptions()
  initMaster(options)
}
