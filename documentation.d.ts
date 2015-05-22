import mongoose = require('mongoose');

declare module "mongoose-babelmodel" {

    export interface Model extends mongoose.Model {
        constructor(schema: Object): Model;
        extend(extension: Model): void;
        _schema: Object;
        buildSchemaObject(): void;
        generateSchema(): mongoose.Schema;
        generateModel(): mongoose.Model;
    }

    export function validation(path: String, message: String): Function;
    export function pre(action: String, priority: Number): Function;
    export function post(action: String, priority: Number): Function;
    export function plugin(pluginFunction: Function, options: Object): Function;
}