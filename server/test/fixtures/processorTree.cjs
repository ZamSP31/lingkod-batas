// Synthetic only: no documents, SDKs, credentials or network access.
const { spawn } = require('node:child_process');
process.once('message', ({ buffer }) => {
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 20000)'], { stdio: 'ignore', windowsHide: true });
  child.once('spawn', () => { if (Buffer.from(buffer).includes('hang')) return; process.send({ ok: true, result: {
    text: String(child.pid), method: 'direct', confidence: null, flaggedForReview: false,
  } }); });
});
setTimeout(() => process.exit(0), 25000);
