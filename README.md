# mongoose-babelmodel
A library for using babeljs to create mongoose models from classes

### Installation
npm i --save mongoose-babelmodel

### Requirements
BabelJs for compiling to ES5 using --stage 0 flag for decorators

### Usage Example
    import {Model, pre} from 'mongoose-babelmodel'
    
    class User extends Model {
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
    
    let user = new User({
        name: "String",
        password: "String",
        email: "String",
        roles: {type: Array, default: ['subscriber']},
        _posts: {type: Array}
    });
    
    export default user.generateModel();
    
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

##### pre/post(action)
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
    