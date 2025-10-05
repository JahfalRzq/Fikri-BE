const indexModule = require('../dist/index.js');
const app = indexModule.default || indexModule;

module.exports = app;