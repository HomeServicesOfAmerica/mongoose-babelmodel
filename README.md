# mongoose-babelmodel
A library for using babeljs to create mongoose models from classes

### Installation
npm i --save mongoose-babelmodel

### Requirements
BabelJs for compiling to ES5 using --stage 0 flag for decorators

### Usage Example
    import {Model, pre} from 'mongoose-babelmodel'
    
    class User extends Model {
        name = String;
        password = String;
        email = String;
        roles = {type: Array, default: ['Subscriber']};
        _posts: Array;
        
        // added to schema using .method()
        verifyPassword(password) {
            let encrypted = yourEncryptionFunc(password);
            return encrypted === this.password;
        }
        
        // added to schema using .method()
        hasRole(role) {
            return role.name in this.roles;
        }
        
        // added to schema using .pre()
        @pre('save')
        static encryptPass(next) {
            this.password = yourEncryptionFunc(this.password);
        }
        
        // added to schema using .virtual().get()
        get posts() {
            return this._posts;
        }
        
        // added to schema using .virtual().set()
        set posts(posts) {
            this._posts = posts;
        }
        
        // added to schema using .static
        static usersWithPosts() {
            return this.find({$where: 'this.posts.length > 0'});
        }
    }
    
    let user = new User();
    
    export default user.generateModel();
    
### Declaring Schema

You can declare your schema as class properties ( ES7 stage 0 candidate ) in the following fashion:

    class Example extends Model {
        _schema = {
            name: String,
            type; String
        };
        
        // OR 
        
        name = String;
        type = String;
    }
    
You can also declare your _schema in the constructor. 

    class Example extends Model {
        constructor () {
            super();
            this._schema = { name: String, type: String };
        }
    }
    
Or you can rely on the super constructor to pass in your schema upon initialization

    class Example extends Model {
        instanceMethod () {
            return this.name;
        }
    }
    
    let example = new Example({name: String, type: String});

You can add schema paths easily

    example.newPath = {type: Boolean, default: true};
    
You can remove schema paths easily

    delete example.newPath;
    
How it works:
the _schema property is what is used during model generation. however all instance items are added to the _schema 
object during generateSchema(). Please note that _schema is the base. If you declare a path in _schema and then add
the same path to the instance object it will overwrite. Like so:

    class Example extends Model {
        _schema = {
            name: String,
            type; String
        };
    }
    
    let example = new Example();
    
    // During generateSchema _schema.type will be set to {type: String, default: 'Test'}
    example.type = {type: String, default: 'Test'};

    
### API Documentation
#### Model
The Model class is the base class that contains the core functions for generating the Mongoose model. It has the 
following methods available:

##### model.extend(modelInstance)
You can call extend and pass in another instance of model extended from babelmodel in order to combine all methods,
Schema paths, pre/post middleware, static functions and validators into the calling instance.
 
    class Post extends Model {
        @pre('save')
        static generateSlug(next) {
            this.slug = this.title.toLowerCase().replace(' ', '-');
            next();
        }
    }
    
    class Tag extends Model {
        static withTag(tag) {
            return this.find({tags: {$in: tag}}).exec();
        }
    }
    
    // String 'ObjectId' as schema type will get replaced with Schema.Types.ObjectId
    let post = new Post({
        title: {type: String, required: true},
        content: {type: String, required: true},
        author: {type: 'ObjectId', ref: 'User'}
    });
    
    let tag = new Tag({
        tags: {type: Array, default: []}
    });
    
    post.extend(tag);
    
    export default post.generateModel();
    
##### model.generateSchema()
generates the mongoose schema and adds all functions/middleware/validations/virtuals to the appropriate places.
Getter and Setter functions are added using .virtual(name).get() and .set() respectively.
Static functions get added using .static()
Regular functions added through .method() calls
Specially annotated functions (@validation, @pre, @post) get added using appropriate markup

##### model.generateModel()
returns mongoose.model() call, with your Model's name as the name and the generated schema

##### model.schema
Getter/setter functions.
schema.add(schema, overwrite = false) allows you to add schema paths to a model instance before generateModel() is called
schema.remove(schema) - as you would expect, removes schema paths that are found in the schema parameter
schema.list() - returns the schema object
schema = {} - sets the schema object overwriting anything previously set.

#### Method Decorators
All of the following decorators are also exported by the module. They must be declared on static methods. 

##### pre(action, priority = 10)
Decorators that wrap the decorated function, creating a new function that allows it to be automatically added to the 
schema during model.generateSchema(). action accepts any hook action defined in the mongoose documentation. Priority
allows you to control the order in which hooks are executed. the lowest priority hook is executed last, highest first.
Defaults to 10. Hooks added through extensions will honor this order as well so if you add a hook in a extension with
a very high priority it will happen first as long as there isn't a hook with a higher priority on the base model.

##### post(action)
Decorators that wrap the decorated function, creating a new function that allows it to be automatically added to the 
schema during model.generateSchema(). action accepts any hook action defined in the mongoose documentation

##### validation(path, message)
Decorator that wraps the function, creating a new function that allows it to be automatically added to the schema 
during model.generateSchema(). path accepts a string referencing the path to validate, message is the error message
returned if the validation fails.

##### plugin(plugin, options = {})
Decorator for the class to use plugins. Just pass in the plugin function and options. Can stack multiple plugins. 
Plugins are added right before the schema is returned so they will be the last things added to the stack.

    @plugin(autopopulate)
    @plugin(findorcreate)
    class Document {
        // Your class definition
    }
    