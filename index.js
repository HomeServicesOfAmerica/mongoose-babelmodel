var decorators = require( './lib/decorators' );

module.exports = {
  Model: require( './lib/Model' ),
  pre: decorators.pre,
  post: decorators.post,
  plugin: decorators.plugin,
  validation: decorators.validation
};
