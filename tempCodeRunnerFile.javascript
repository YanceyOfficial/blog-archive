const os = require('os')
const process = require('process')

console.log(os.totalmem() / 1024/1024/1024)
console.log(os.cpus().length)