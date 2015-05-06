import mongoose from "mongoose";
import mongooseMoment from "mongoose-moment";
import _ from "lodash";

mongooseMoment(mongoose);

let Schema = mongoose.Schema;

/**
 * Shortcut to getOwnPropertyDescriptor for two possible objects
 * @param {string} name - The name of the Descriptor to search for
 * @param {object} dest - Destination Object
 * @param {object} source - Source Object
 * @returns {Object|null}
 */
function getMethod(name, dest, source) {
  return Object.getOwnPropertyDescriptor(dest, name) || Object.getOwnPropertyDescriptor(source, name);
}

/**
 * Shortcut function to return an object containing the prototype of both the primary object and extension,
 * plus the extension constructor.
 * @param {Object} primary - The parent object.
 * @param {Object} extension - The object whose properties are being subsumed.
 * @returns {{prototype: (Object), extPrototype: (Object|Function), extStatic: (Object|Function)}}
 */
function getClassParts(primary, extension) {
  return {
    prototype: primary.__proto__,
    extPrototype: extension.constructor.prototype,
    extStatic: extension.constructor
  }
}

/**
 * Shortcut function get an array of all function names in dest and source.
 * @param {object} dest - Destination object
 * @param {object} source - Source Object
 * @returns {Array}
 */
function getFunctionNames(dest, source) {
  return _.union(Object.getOwnPropertyNames(dest), Object.getOwnPropertyNames(source));
}

/**
 * Helper method that replaced the string "ObjectId" in schemas with the mongoose.Schema.Types.ObjectId object
 * @param {Object} schema - The schema object
 */
function fixObjectIds(schema) {
  let keys = Object.keys(schema);

  for (let key of keys) {
    if(_.isString(schema[key]) && schema[key].toLowerCase() == 'objectid') {
      schema[key] = Schema.Types.ObjectId;
    } else if (_.isString(schema[key].type) && schema[key].type.toLowerCase() == 'objectid') {
      schema[key].type = Schema.Types.ObjectId;
    }
  }
}

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

export class Model {
  _schema = {};

  constructor(schema = {}) {
    this._schema = schema;
  }

  /**
   * Getter Function for the schema, which allows adding and removing Schema items.
   * @returns {Object}
   */
  get schema() {
    return {
      list: () => {return this._schema},
      add: (schema = {}, overwrite = false) => {
        fixObjectIds(schema);
        for (let key of Object.keys(schema)) {
          if (!this._schema[key] || overwrite) {
            this._schema[key] = schema[key];
          }
        }
        return Object.keys(this._schema);
      },
      remove: (schema = []) => {
        if (_.isString(schema)) {
          schema = [schema];
        }
        for (let key of schema) {
          if (this._schema[key]) {
            delete this._schema[key];
          }
        }
        return Object.keys(this._schema);
      }
    }
  }

  /**
   * Sets the schema to whatever is passed in.
   * @param {Object} schema
   */
  set schema(schema) {
    fixObjectIds(schema);
    this._schema = schema;
  }

  /**
   * Merges other classes extended from Model into an instance of Model.
   * Must call all extensions before generating Schema.
   * @param {object} extension - instance of a class extended from Model
   */
  extend(extension) {
    // Validate the model and throw an error if they are trying to extend a non Model base class.
    if (!extension instanceof Model) {
      throw new Error('You may only use extend with an instance of a Class extended from Model');
    }

    // Extend the current schema with the schema of the extension, overwriting duplicates
    this.schema.add(extension._schema, true);

    // Pull out the various types of functions from self and extension in order to merge functions
    let {extPrototype, prototype, extStatic} = getClassParts(this, extension);
    let prototypeKeys = getFunctionNames(prototype, extPrototype);
    let staticKeys = getFunctionNames(this, extStatic);

    // Add all methods to the prototype
    for (let name of prototypeKeys) {
      let method = getMethod(name, prototype, extPrototype);
      if (typeof method.value == 'function') {
        this.constructor.prototype[name] = method.value;
      }
      if (typeof method.get == 'function') {
        this.constructor.prototype[name] = this.constructor.prototype[name] || {};
        this.constructor.prototype[name].get = method.get;
      }

      if (typeof method.set == 'function') {
        this.constructor.prototype[name] = this.constructor.prototype[name] || {};
        this.constructor.prototype[name].set = method.set;
      }
    }

    // Add all statics to the class itself.
    for (let name of staticKeys) {
      let method = getMethod(name, this, extStatic);
      if (typeof method.value == 'function') {
        this[name] = method.value;
      }
    }
  }

  /**
   * Generates the mongoose schema for the model.
   */
  generateSchema() {
    let schema = new Schema(this._schema);
    let proto = this.constructor.prototype;
    let self = this;
    let staticProps = Object.getOwnPropertyNames(self);
    let prototypeProps = Object.getOwnPropertyNames(proto);
    let instanceProps = prototypeProps.filter(name => name !== 'constructor');

    for (let name of staticProps) {
      let method = Object.getOwnPropertyDescriptor(self, name);
      if (typeof method.value == 'function') {
        let prefix = name.split("_")[0];
        switch (prefix) {
          case 'pre':
            let middle = method.value();
            schema.pre(middle.action, middle.fn);
            break;
          case 'post':
            let middle = method.value();
            schema.post(middle.action, middle.fn);
            break;
          case 'validator':
            let validator = method.value();
            schema.path(validator.path).validate(validator.fn, validator.message);
            break;
          default:
            schema.static(name, method.value);
        }
      }
    }


    for (let name of instanceProps) {
      let method = Object.getOwnPropertyDescriptor(proto, name);
      if (typeof method.value == 'function') {
        schema.method(name, method.value);
      }
      if (typeof method.get == 'function') schema.virtual(name).get(method.get);
      if (typeof method.set == 'function') schema.virtual(name).set(method.set);
    }

    if (this.constructor.hasOwnProperty('plugins')) {
      for (let plugin of this.constructor.plugins) {
        schema.plugin(plugin.fn, plugin.options);
      }
    }

    return schema;
  }

  /**
   * generates the mongoose model for the Model
   * @returns {*|Model<T>|Model<U>|any}
   */
  generateModel() {
    return mongoose.model(this.constructor.name, this.generateSchema());
  }


}