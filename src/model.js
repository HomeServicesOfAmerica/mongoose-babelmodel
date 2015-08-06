import { fixObjectIds, getFunctionNamesOrdered } from './helpers';
import mongoose from 'mongoose';
import _ from 'lodash';

/**
 * @class Model
 * @augments mongoose.Model
 * @inheritdoc mongoose.Model
 */
export default class Model {
  _schema = {};

  constructor ( schema = {} ) {
    this._schema = schema;
    this.options = this.options || {};
  }

  /**
   *
   */

  /**
   * Getter Function for the schema, which allows adding and removing Schema items.
   * @returns {Object}
   */
  get schema () {
    return {
      list: () => {
        return this._schema;
      },
      add: ( schema = {}, overwrite = false ) => {
        fixObjectIds( schema );
        for ( let key of Object.keys( schema ) ) {
          if ( !this._schema[key] || overwrite ) {
            this._schema[key] = schema[key];
          }
        }
        return Object.keys( this._schema );
      },
      remove: ( schema = [] ) => {
        if ( _.isString( schema ) ) {
          schema = [schema];
        }
        for ( let key of schema ) {
          if ( this._schema[key] ) {
            delete this._schema[key];
          }
        }
        return Object.keys( this._schema );
      }
    };
  }

  /**
   * Sets the schema to whatever is passed in.
   * @param {Object} schema
   */
  set schema ( schema ) {
    fixObjectIds( schema );
    this._schema = schema;
  }

  /**
   * Merges other classes extended from Model into an instance of Model.
   * Must call all extensions before generating Schema.
   * @param {object} extension - instance of a class extended from Model
   */
  extend ( extension ) {
    // Validate the model and throw an error if they are trying to extend a non Model base class.
    if ( !extension instanceof Model ) {
      throw new Error( 'You may only use extend with an instance of a Class extended from Model' );
    }

    // Extend the current schema with the schema of the extension, overwriting duplicates
    this.schema.add( extension._schema, true );

    // Pull out the various types of functions from self and extension in order to merge functions
    let extPrototype = extension.constructor.prototype;
    let extStatic = extension.constructor;
    let prototypeKeys = Object.getOwnPropertyNames( extPrototype );
    let staticKeys = Object.getOwnPropertyNames( extStatic );
    let extendedPaths = Object.getOwnPropertyNames( extension );

    extendedPaths.forEach( extendedPath => {
      if ( extendedPath === '_schema' ) {
        return;
      }
      this[extendedPath] = extension[extendedPath];
    } );

    // Add all methods to the prototype
    for ( let name of prototypeKeys ) {
      if ( name === 'constructor' ) {
        continue;
      }
      let method = Object.getOwnPropertyDescriptor( extPrototype, name );
      if ( typeof method.value == 'function' ) {
        this.constructor.prototype[name] = method.value;
        continue;
      }

      if ( typeof method.get == 'function' || typeof method.set == 'function' ) {
        let get = method.get || null;
        let set = method.set || null;

        let options = { configurable: true, enumerable: true };

        if ( set ) {
          options.set = set;
        }
        if ( get ) {
          options.get = get;
        }
        Object.defineProperty( this.constructor.prototype, name, options );
      }
    }

    // Add all statics to the class itself.
    for ( let name of staticKeys ) {
      let method = Object.getOwnPropertyDescriptor( extStatic, name );
      if ( typeof method.value == 'function' ) {
        this.constructor[name] = method.value;
      }
    }


    if ( extension.constructor.hasOwnProperty( 'plugins' ) ) {
      if ( !this.constructor.hasOwnProperty( 'plugins' ) ) {
        this.constructor.plugins = extension.constructor.plugins;
      } else {
        for ( let plugin of extension.constructor.plugins ) {
          // noinspection Eslint
          if ( this.constructor.plugins.find( element => element.fn.name === plugin.fn.name ) === undefined ) {
            this.constructor.plugins.push( plugin );
          }
        }
      }
    }
  }

  buildSchemaObject () {
    let paths = _.filter( Object.getOwnPropertyNames( this ), name => name !== '_schema' && name !== 'options' );
    this._schema = this._schema || {};
    paths.forEach( path => {
      this._schema[path] = this[path];
    } );
    fixObjectIds( this._schema );
  }

  /**
   * Generates the mongoose schema for the model.
   */
  generateSchema () {
    this.buildSchemaObject();
    let schema = new mongoose.Schema( this._schema, this.options );
    let proto = this.constructor.prototype;
    let self = this.constructor;
    let staticProps = getFunctionNamesOrdered( self );
    let prototypeProps = getFunctionNamesOrdered( proto );
    let instanceProps = prototypeProps.filter( name => name !== 'constructor' );

    for ( let name of staticProps ) {

      let method = Object.getOwnPropertyDescriptor( self, name );
      if ( typeof method.value == 'function' ) {
        let prefix = name.split( '_' )[0];
        switch ( prefix ) {
          case 'pre':
            let pre = method.value();
            schema.pre( pre.action, pre.fn );
            break;
          case 'post':
            let post = method.value();
            schema.post( post.action, post.fn );
            break;
          case 'validator':
            let validator = method.value();
            schema.path( validator.path ).validate( validator.fn, validator.message );
            break;
          default:
            schema.static( name, method.value );
        }
      }
    }

    for ( let name of instanceProps ) {
      let method = Object.getOwnPropertyDescriptor( proto, name );
      if ( typeof method.value == 'function' ) {
        schema.method( name, method.value );
      }

      if ( method.set || method.get ) {
        let virtual = schema.virtual( name );

        if ( typeof method.set == 'function' ) {
          virtual.set( method.set );
        }

        if ( typeof method.get == 'function' ) {
          virtual.get( method.get );
        }
      }

      if ( method.set && typeof method.set == 'function' ) {
        schema.virtual( name ).set( method.set );
      }

      if ( method.get && typeof method.get == 'function' ) {
        schema.virtual( name ).get( method.get );
      }
    }

    if ( this.constructor.hasOwnProperty( 'plugins' ) ) {
      for ( let plugin of this.constructor.plugins ) {
        schema.plugin( plugin.fn, plugin.options );
      }
    }

    return schema;
  }

  /**
   * generates the mongoose model for the Model
   * @returns {Object}
   */
  generateModel () {
    return mongoose.model( this.constructor.name, this.generateSchema() );
  }

  static generateSchema () {
    let model = new this();
    return model.generateSchema();
  }

  static generateModel ( ...extensions ) {
    let model = new this();
    for ( let extension of extensions ) {
      model.extend( extension );
    }
    return model.generateModel();
  }

}