import {fixObjectIds, getFunctionNames, getMethod, getClassParts} from './helpers';
import mongoose from 'mongoose';

export default class Model {
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
    let staticKeys = getFunctionNames(this.constructor, extStatic);

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
      let method = getMethod(name, this.constructor, extStatic);
      if (typeof method.value == 'function') {
        this[name] = method.value;
      }
    }
  }

  /**
   * Generates the mongoose schema for the model.
   */
  generateSchema() {
    let schema = new mongoose.Schema(this._schema);
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