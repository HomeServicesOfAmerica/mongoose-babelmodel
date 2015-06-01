import should from 'should';
import { Model } from './../';
import mongoose from 'mongoose';


/**
 * This is a simple test class to test some of the most basic features of the module
 * @class Simple
 * @augments mongoose.Model
 * @inheritdoc mongoose.Model
 */
class Simple extends Model {
  name = String;
  type = String;

  /**
   * Gets all items of this model with a type set to the string passed in.
   * @param {String} type - the string to search for in the type field.
   * @return {Query}
   */
  static getAllOfType ( type = 'basic' ) {
    return this.find( { type } );
  }
}

let simpleExample = new Simple();
var MongooseSimple, test;

describe( 'Basic Functionality', () => {

  describe( 'Class Methods and properties', () => {

    it( 'should have a _schema attribute ', () => {
      simpleExample.should.have.property( '_schema' );
    } );

    it( 'should have a static method called getAllOfType', () => {
      Simple.should.have.property( 'getAllOfType' );
    } );

    it( 'should have a method named generateSchema', () => {
      simpleExample.should.have.property( 'generateSchema' );
    } );

    it( 'should have a method named generateModel', () => {
      simpleExample.should.have.property( 'generateModel' );
    } );

    it( 'should have schema manipulation methods ( add, remove, list )', () => {
      simpleExample.should.have.property( 'schema' );
      simpleExample.schema.should.have.property( 'add' );
      simpleExample.schema.should.have.property( 'remove' );
      simpleExample.schema.should.have.property( 'list' );
    } );

    it( 'should have a method called extend for extending Models', () => {
      simpleExample.should.have.property( 'extend' );
    } );

  } );

  describe( 'Generating basic model', () => {

    it( 'should generate a fully functional mongoose model', () => {
      try {
        MongooseSimple = simpleExample.generateModel();
      } catch ( err ) {
        should.not.exist( err );
      }
    } );
    it( 'Should have default Mongoose static methods', () => {
      mongoose.model( 'Simple' ).should.have.property( 'find' );
      mongoose.model( 'Simple' ).should.have.property( 'create' );
      mongoose.model( 'Simple' ).should.have.property( 'findById' );
      mongoose.model( 'Simple' ).should.have.property( 'update' );
      mongoose.model( 'Simple' ).should.have.property( 'findOne' );
    } );
    it( 'should have registered the model in mongoose', () => {
      mongoose.models.should.have.property( 'Simple' );
    } );
    it( 'should have a static method on the mongoose model', () => {
      mongoose.models.Simple.should.have.property( 'getAllOfType' );
    } );

  } );

  describe( 'Creating an instance of the mongoose model', () => {

    before( () => {
      test = new MongooseSimple();
    } );

    it( 'instance should have access to default mongoose functions for instances', () => {
      test.should.have.property( 'save' );
      test.should.have.property( 'populate' );
      test.should.have.property( 'remove' );
    } );

    it( 'should have a property type', () => {
      test.should.have.property( 'type' );
    } );

    it( 'should have a property name', () => {
      test.should.have.property( 'name' );
    } );

  } );

} );
