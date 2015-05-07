import {Schema} from 'mongoose';
import _ from 'lodash';

/**
 * Shortcut to getOwnPropertyDescriptor for two possible objects
 * @param {string} name - The name of the Descriptor to search for
 * @param {object} dest - Destination Object
 * @param {object} source - Source Object
 * @returns {Object|null}
 */
export function getMethod(name, dest, source) {
  return Object.getOwnPropertyDescriptor(dest, name) || Object.getOwnPropertyDescriptor(source, name);
}

/**
 * Shortcut function to return an object containing the prototype of both the primary object and extension,
 * plus the extension constructor.
 * @param {Object} primary - The parent object.
 * @param {Object} extension - The object whose properties are being subsumed.
 * @returns {{prototype: (Object), extPrototype: (Object|Function), extStatic: (Object|Function)}}
 */
export function getClassParts(primary, extension) {
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
export function getFunctionNames(dest, source) {
  return _.union(Object.getOwnPropertyNames(dest), Object.getOwnPropertyNames(source));
}

/**
 * Helper method that replaced the string "ObjectId" in schemas with the mongoose.Schema.Types.ObjectId object
 * @param {Object} schema - The schema object
 */
export function fixObjectIds(schema) {
  let keys = Object.keys(schema);

  for (let key of keys) {
    if(_.isString(schema[key]) && schema[key].toLowerCase() == 'objectid') {
      schema[key] = Schema.Types.ObjectId;
    } else if (_.isString(schema[key].type) && schema[key].type.toLowerCase() == 'objectid') {
      schema[key].type = Schema.Types.ObjectId;
    }
  }
}