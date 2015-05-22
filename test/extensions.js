import should from 'should';
import babelModel from './../index';
import mongoose from 'mongoose';
import _ from 'lodash';

let { Model, pre, post, plugin, validation } = babelModel;


function pluginExample ( schema ) {
  // noinspection ReservedWordAsName
  schema.add( { pluginActivated: { type: Boolean, default: true }} );
}

@plugin( pluginExample )
class Example extends Model {
  name = String;

  // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  test () {
    return 3;
  }

  // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  testthree () {
    return 208;
  }

  // noinspection JSUnusedGlobalSymbols
  @pre( 'save', 30 )
  static addDeckerToName ( next ) {
    this.name += 'Decker';
    next();
  }

  // noinspection JSUnusedGlobalSymbols
  @pre( 'save', 50 )
  static addSpaceToName ( next ) {
    this.name += ' ';
    next();
  }
}

class Extension extends Model {
  _value = 0;
  // noinspection ReservedWordAsName
  isExtended = { type: Boolean, default: true };

  // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  testtwo () {
    return 4;
  }


  static testStatic () {
    return 5;
  }

  // noinspection JSUnusedGlobalSymbols
  @validation( 'name', 'Your name is bad' )
  static namesCantBeBad ( name ) {
    return !name.startsWith( 'Brad' );
  }

  // noinspection JSUnusedGlobalSymbols
  @pre( 'remove', 0 )
  static testPre ( next ) {
    next();
  }

  // noinspection JSUnusedGlobalSymbols
  @post( 'save', 0 )
  static addMiddleName ( doc ) {
    let parts = doc.name.split( ' ' );
    doc.name = `${parts[0]} Marie ${parts[1]}`;
  }

  get value () {
    return this._value;
  }

  set value ( v ) {
    this._value = v;
  }
}

var extension = new Extension();

var model = new Example();
var MongooseExample, example;

mongoose.connect( 'mongodb://localhost/test-es6' );

describe( 'Model', () => {

  describe( 'Extending Models', () => {
    it( 'Should add prototype functions from extension into base', () => {
      model.extend( extension );
      model.constructor.prototype.should.have.property( 'testtwo' );
    } );

    it( 'Should add static methods from extension into base', () => {
      model.constructor.should.have.property( 'testStatic' );
    } );

    it( 'Should merge getters and setters into prototype of base', () => {
      model.constructor.prototype.should.have.property( 'value' );
      model.constructor.prototype.value = 3;
      model.constructor.prototype.value.should.equal( 3 );
    } );
  } );

  describe( 'Adding Plugins', () => {

    it( 'Should have a plugins object', () => {
      model.constructor.should.have.property( 'plugins' );
    } );

  } );

  describe( 'Mongoose Model Validation', () => {

    before( () => {
      model.generateModel();
      MongooseExample = mongoose.model( 'Example' );
      example = new MongooseExample();
    } );

    it( 'should have static method from extension available on the mongoose model', () => {
      MongooseExample.should.have.property( 'testStatic' );
    } );

    it( 'should have instance methods from parent and extension model available on the mongoose model', () => {
      example.should.have.property( 'test' );
      example.should.have.property( 'testtwo' );
      example.should.have.property( 'testthree' );
    } );

    it( 'should have all schema paths', () => {
      example.should.have.property( 'name' );
      example.should.have.property( 'isExtended' );
    } );


    it( 'should have all middleware in the callQueue', () => {
      let preQueue = _.filter( MongooseExample.schema.callQueue, call => call[0] === 'pre' );
      let preNames = _.map( preQueue, preName => preName[1][1].name );

      preNames.should.containDeep( [ 'addDeckerToName', 'addSpaceToName', 'testPre' ] );
    } );

  } );

} );
