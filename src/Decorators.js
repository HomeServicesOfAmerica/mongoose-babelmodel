/**
 * @Wrapper Function that mutates the function.
 * Mutated function named validator_{original function name}
 * Returns a object containing necessary keys to register a validator.
 * @param {String} path - the schema path to validate
 * @param {String} message - the message to return if validation fails
 * @returns {Function}
 */
export function validation(path, message) {
  return (target, key, descriptor) => {
    let fn = descriptor.value;
    key = `validator_${key}`;
    target[key] = () => {return {path, fn, message}};
    delete descriptor.value;
    delete descriptor.writeable;
  }
}

/**
 * @Wrapper function that mutates the function
 * Mutated function named pre_{original function name}
 * returns a object containing necessary keys to register a pre hook
 * @param {String} action - The action to hook into
 * @returns {Function}
 */
export function pre(action) {
  return (target, key, descriptor) => {
    let fn = descriptor.value;
    key = `pre_${key}`;
    target[key] = () => {return {fn, action}};
    delete descriptor.value;
    delete descriptor.writeable;
  }
}

/**
 * @Wrapper function that mutates the function
 * Mutated function named post_{original function name}
 * returns a object containing necessary keys to register a post hook
 * @param {String} action - The action to hook into
 * @returns {Function}
 */
export function post(action) {
  return (target, key, descriptor) => {
    let fn = descriptor.value;
    key = `post_${key}`;
    target[key] = () => {return {fn, action}};
    delete descriptor.value;
    delete descriptor.writeable;
  }
}

/**
 * @Wrapper function for classes to add plugins
 * creates a plugins array to the class that is used in schema generation
 * returns a object containing necessary keys to register a plugin on the schema
 * @param {Function} plugin - The plugin function
 * @param {Object} options - The plugin options
 * @returns {Function}
 */
export function plugin(plugin, options = {}) {
  return target => {
    target.plugins = target.plugins || [];
    target.plugins.push({fn: plugin, options});
  }
}