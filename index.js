module.exports.Model = require('./lib/Model');
var decorators = require('./lib/decorators');
module.exports.pre = decorators.pre;
module.exports.post = decorators.post;
module.exports.plugin = decorators.plugin;
module.exports.validation = decorators.validation;