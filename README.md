# mongoose-babelmodel
A library for using babeljs to create mongoose models from classes

### Installation
npm i --save mongoose-babelmodel

### Requirements
BabelJs for compiling to ES5 using --stage 0 flag for decorators

### Usage Example
    import {Model, pre} from 'mongoose-babelmodel'
    
    class User extends Model {
        verifyPassword(password) {
            let encrypted = yourEncryptionFunc(password);
            return encrypted === this.password;
        }
        
        hasRole(role) {
            return role.name in this.roles;
        }
        
        @pre('save')
        static encryptPass(next) {
            this.password = yourEncryptionFunc(this.password);
        }
    }
    
    let user = new User({
        name: "String",
        password: "String",
        email: "String",
        roles: {type: Array, default: ['subscriber']}
    });
    
    export default user.generateModel();
    
### API Documentation
#### Model
The Model class is the base class that contains the core functions for generating the Mongoose model. It has the 
following methods available:

##### extend(modelInstance)
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
    
    let post = new Post({
        title: {type: String, required: true},
        content: {type: String, required: true}
    });
    
    let tag = new Tag({
        tags: {type: Array, default: []}
    });
    
    post.extend(tag);
    
    export default post.generateModel();

    
    