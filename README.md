# mongoose-babelmodel
A library for using babeljs to create mongoose models from classes

### Installation
npm i --save mongoose-babelmodel

### Requirements
BabelJs for compiling to ES5 using --stage 0 flag for decorators

### Usage Example
    import {Model, pre} from 'mongoose-babelmodel'
    
    class User {
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
    
    let user = new User();
    
    user.schema = {
        name: "String",
        password: "String",
        email: "String",
        roles: {type: Array, default: ['subscriber']}
    };
    
    export default user.generateModel();