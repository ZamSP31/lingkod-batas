// Exercise the actual worker's parent-disconnect handler without parsing or network.
require('../../src/services/documentWorker');
const { spawn } = require('node:child_process');
const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 20000)'], { stdio: 'ignore', windowsHide: true });
child.once('spawn', () => process.send({ pid: child.pid }));
setTimeout(() => process.exit(0), 25000);
