# fastter

A lightweight Node.js CLI for running file-based tasks in parallel across multiple CPU cores using the `cluster` module.

Originally built for parallelizing test suites, the hook-based architecture makes it usable for any file-centric parallel processing.

## Installation

```bash
npm install fastter
```

## Usage

```bash
fastter --config ./fastter.config.js src/**/*.test.js
```

### CLI Options

| Option        | Description                           | Default            |
| ------------- | ------------------------------------- | ------------------ |
| `--config`    | **(Required)** Path to config file    | -                  |
| `--cpu-limit` | Number of CPUs to use                 | `os.cpus().length` |
| `--debug`     | Show worker logs (hidden by default)  | `false`            |
| `--min`       | Minimize logs, hide spinner           | `false`            |

`CPU_LIMIT` environment variable overrides `--cpu-limit`.

## Configuration File

The config file is a CommonJS module that hooks into the execution lifecycle.

```js
// fastter.config.js
module.exports = {
  // Master process: runs once before workers are forked
  beforeSetupWorkers: async ({ options }) => {},

  // Returns env vars injected into each worker process
  setupWorkerEnvironment: ({ options, worker }) => {
    return { WORKER_ID: worker }
  },

  // Worker process: runs once before the work loop starts
  prepareTest: async ({ options }) => {},

  // Worker process: runs before each file
  beforeNextRun: async ({ options }) => {},

  // Worker process: main task, runs for each file
  // options._nextFile contains the current file path
  runTest: async ({ options }) => {
    return { stats: { passed: 1, failed: 0 } }
  },

  // Worker process: runs when all files are processed
  stopTest: async ({ options, exitCode }) => {},
}
```

## How It Works

1. The master process collects all files matching the provided glob patterns and forks worker processes.
2. Each worker calls `prepareTest`, then enters a loop asking the master for the next file.
3. The master assigns files one by one until the queue is empty, then tells each worker to stop.
4. Workers call `stopTest`, disconnect, and exit. The master prints summary stats.

## Development

```bash
npm test          # run tests
npm run lint      # ESLint check
npm run lint:fix  # ESLint auto-fix
npm run format    # Prettier format
npm run format:check  # Prettier check (CI)
```

## License

ISC
