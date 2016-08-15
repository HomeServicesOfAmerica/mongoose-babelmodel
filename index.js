var decorators = require( './lib/decorators' );

module.exports = {
  Model: require( './lib/model' ),
  pre: decorators.pre,
  post: decorators.post,
  plugin: decorators.plugin,
  validation: decorators.validation
};
