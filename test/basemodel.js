import should from 'should';
import {Model, validation, pre, post, plugin} from './../index';
import mongoose from 'mongoose';

function pluginExample(schema) {
  schema.add({pluginActivated: {type: Boolean, default: true}});
}

@plugin(pluginExample)
class Example extends Model {
  test() {
    return 3;
  }

  testthree() {
    return 208;
  }

  @pre('save')
  static addDeckerToName(next) {
    this.name += ' Decker';
    next();
  }
}

class Extension extends Model {
  _value = 0;
  testtwo() {
    return 4;
  }

  static testStatic() {
    return 5;
  }

  @validation('name', 'Your name is bad')
  static namesCantBeBad(name) {
    return !name.startsWith('Brad');
  }

  @post('save')
  static addMiddleName(doc) {
    let parts = doc.name.split(" ");
    doc.name = `${parts[0]} Marie ${parts[1]}`;
  }

  get value() {
    return this._value;
  }

  set value(v) {
    this._value = v;
  }
}

var extension = new Extension();
extension.schema = {isExtended: {type: Boolean, default: true}};

mongoose.connect('mongodb://localhost/test-es6');

var model, example;

describe('Model', () => {

  before(() => {
    model = new Example({test: Boolean});
  });

  describe('Schema functionality', () => {

    it('Should have a schema method', () => {
      model.should.have.property('schema');
    });

    it('Should have a schema add method', () => {
      model.schema.should.have.property('add');
    });

    it('Should have a schema remove method', () => {
      model.schema.should.have.property('remove');
    });

    it('Should allow you to set the schema in the model', () => {
      model.schema.list().should.have.property('test');
      let schema = {
        name: String,
        value: {type: String, default: 'blank'}
      };
      model.schema = schema;
      model.schema.list().should.equal(schema);
    });

    it('Should allow schema definitions to be added', () => {
      model.schema.add({objectId: 'objectid'});
      model.schema.list().should.have.property('objectId');
    });

    it('Should convert objectid string into mongoose schem type ObjectId', () => {
      model.schema.list().objectId.should.equal(mongoose.Schema.Types.ObjectId);
    });


  });

  describe('Extending Models', () => {

    it('Should have an extend method', () => {
      model.should.have.property('extend');
    });

    it('Should add prototype functions from extension into base', () => {
      model.extend(extension);
      model.constructor.prototype.should.have.property('testtwo');
    });

    it('Should add static methods from extension into base', () => {
      model.should.have.property('testStatic');
    });

    it('Should merge getters and setters into prototype of base', () => {
      model.constructor.prototype.should.have.property('value');
      model.constructor.prototype.value = 3;
      model.constructor.prototype.value.should.equal(3);
    });

  });

  describe('Plugins', () => {

    it('Should have a plugins object', () => {
      model.constructor.should.have.property('plugins');
    });

  });

  describe('Mongoose Model generation', () => {

    it('Should generate a fully functional mongoose model', (done) => {
      try {
        model.generateModel();
      } catch (err) {
        should.not.exist(err);
      }
      done();
    });

  });


  describe('Default Mongoose Functions', () => {

    it('Should have default Mongoose static methods', () => {
      mongoose.model('Example').should.have.property('find');
      mongoose.model('Example').should.have.property('create');
      mongoose.model('Example').should.have.property('findById');
      mongoose.model('Example').should.have.property('update');
      mongoose.model('Example').should.have.property('findOne');
    });

    it('Should allow for a new instance to be made', () => {
      var ExampleModel = mongoose.model('Example');
      example = new ExampleModel();
      example.should.be.instanceof(mongoose.model('Example'));
    });

    it('instance should have access to default mongoose functions for instances', () => {
      example.should.have.property('save');
      example.should.have.property('populate');
      example.should.have.property('remove');
    });

  });

  describe('Custom Methods', () => {

    it ('should have all static methods available on the model', () => {
      mongoose.model('Example').should.have.property('testStatic');
    });

    it ('should have all public methods available on the instance', () => {
      example.should.have.property('value');
      example.should.have.property('testthree');
      example.should.have.property('testtwo');
      example.should.have.property('test');
    });

    it ('should perform validations from @validation annotation', (done) => {
      example.name = "Bradley";
      example.save(err => { should.exist(err); return done()});
    });

    it ('should perform middleware actions on pre and post annotations', (done) => {
      example.name = "Amanda";
      example.save((err, doc) => {
        should.not.exist(err);
        doc.name.should.equal("Amanda Marie Decker");
        doc.remove(done);
      });
    });

  });

});