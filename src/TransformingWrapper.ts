import {TransformerSet} from "./TransformerSet";

const ObjectPrototype = Object.prototype;
const {propertyIsEnumerable} = ObjectPrototype;

const TARGET = Symbol("target");
const TRANSFORMERS = Symbol("transformers");

const GET = Symbol("get");
const SET = Symbol("set");

export class TransformingWrapper<T extends object> {
    protected [TARGET]: T;
    protected [TRANSFORMERS]: TransformerSet;

    constructor(target: T, transformers: TransformerSet) {
        this[TARGET] = target;
        this[TRANSFORMERS] = transformers;

        for (let object = target; object !== ObjectPrototype; object = Object.getPrototypeOf(object)) {
            Object.getOwnPropertyNames(object).forEach((property) => {
                if (property in this) {
                    return;
                }

                const value = Reflect.get(object, property, target);

                if (typeof value === "function") {
                    Object.defineProperty(this, property, {
                        value,
                        configurable: false,
                        writable: false,
                        enumerable: propertyIsEnumerable.call(object, property)
                    });
                } else {
                    Object.defineProperty(this, property, {
                        configurable: false,
                        enumerable: propertyIsEnumerable.call(object, property),
                        get: this[GET].bind(this, property as keyof T),
                        set: this[SET].bind(this, property as keyof T)
                    });
                }
            });
        }

        Object.seal(this);
    }

    protected [GET](property: keyof T): unknown {
        const target = this[TARGET];

        return this[TRANSFORMERS].reduce(
            (value, transformer) =>
                transformer.property === property && transformer.target.matches(this)
                    ? transformer.callback(value, target[property], this, property)
                    : value,
            target[property]
        );
    }

    protected [SET](property: keyof T, value: any): void {
        this[TARGET][property] = value;
    }
}
