import {strict as assert} from "assert";

import {ITransformable, Transformer, TransformerSet, wrapAsTransformable} from "../src";

class ImmutableObject {
    public one = "foo";
    public two = "bar";
    public three = "baz";

    public method(): void {
        // no operation
    }
}

interface ImmutableObject extends ITransformable<typeof ImmutableObject> {}

class MutableObject {
    public static readonly mutableProperties = ["one", "two"] as const;

    public one = "baz";
    public two = "foobar";
    public wasCalled = false;

    public method(): void {
        this.wasCalled = true;
    }
}

interface MutableObject extends ITransformable<typeof MutableObject> {}

class ChildMutableObject extends MutableObject {}
interface ChildMutableObject extends ITransformable<typeof ChildMutableObject> {}

describe("transformers", function () {
    describe("TransformerSet", function () {
        const object = new ImmutableObject();

        const transformerA = Transformer.forWrappedObject(object, "one", 0, () => "transformerA");
        const transformerB = Transformer.forWrappedObject(object, "two", 0, () => "transformerB");
        const transformerC = Transformer.forWrappedObject(object, "three", 10, () => "transformerC");

        it("should add new transformers", function () {
            const transformerSet = new TransformerSet();
            transformerSet.add(transformerA);

            assert.deepStrictEqual(transformerSet.all(), [transformerA]);
        });

        it("should sort transformers by priority", function () {
            const transformerSet = new TransformerSet();

            transformerSet.add(transformerA);
            assert.deepStrictEqual(transformerSet.all(), [transformerA]);

            transformerSet.add(transformerB);
            assert.deepStrictEqual(transformerSet.all(), [transformerA, transformerB]);

            transformerSet.add(transformerC);
            assert.deepStrictEqual(transformerSet.all(), [transformerC, transformerA, transformerB]);
        });

        it("should contain unique transformers", function () {
            const transformerSet = new TransformerSet();
            transformerSet.add(transformerA);
            transformerSet.add(transformerA);

            assert.deepStrictEqual(transformerSet.all(), [transformerA]);
        });

        it("should remove transformers", function () {
            const transformerSet = new TransformerSet();
            transformerSet.add(transformerA);
            transformerSet.add(transformerC);

            assert.strictEqual(transformerSet.delete(transformerA), true);
            assert.deepStrictEqual(transformerSet.all(), [transformerC]);

            assert.strictEqual(transformerSet.delete(transformerA), false);
        });

        it("should clear the transformers", function () {
            const transformerSet = new TransformerSet();
            transformerSet.add(transformerA);
            transformerSet.add(transformerB);
            transformerSet.add(transformerC);
            transformerSet.clear();

            assert.deepStrictEqual(transformerSet.all(), []);
        });
    });

    const emptyTransformerSet = new TransformerSet();

    it("should wrap an object", function () {
        const immutable = new ImmutableObject();
        const wrappedImmutable = wrapAsTransformable(immutable, emptyTransformerSet);

        assert.strictEqual(Object.isSealed(wrappedImmutable), true);
        assert.strictEqual(wrappedImmutable.one, immutable.one);
        assert.strictEqual(wrappedImmutable.two, immutable.two);

        const mutable = new ImmutableObject();
        const wrappedMutable = wrapAsTransformable(mutable, emptyTransformerSet);

        assert.strictEqual(Object.isSealed(wrappedMutable), true);
        assert.strictEqual(wrappedMutable.one, mutable.one);
        assert.strictEqual(wrappedMutable.two, mutable.two);
    });

    it("should wrap an object's prototype", function () {
        const object = new ImmutableObject();

        const prototype = Object.create(Object.getPrototypeOf(object));
        prototype.propertyFromPrototype = "foobar";

        Object.setPrototypeOf(object, prototype);

        const wrapped = wrapAsTransformable(object, emptyTransformerSet);
        assert.strictEqual((wrapped as any).propertyFromPrototype, "foobar");
    });

    it("should be enumerable", function () {
        const object = new ImmutableObject();
        const wrapped = wrapAsTransformable(object, emptyTransformerSet);

        assert.notStrictEqual(Object.keys(wrapped).length, 0);
    });

    it("should only enumerate the target object's properties", function () {
        const object = new ImmutableObject();
        const wrapped = wrapAsTransformable(object, emptyTransformerSet);

        const enumerable: any[] = [];

        for (const name in object) {
            enumerable.push(name);
        }

        assert.deepStrictEqual(Object.keys(wrapped), enumerable);
    });

    it("should be writable", function () {
        const object = new MutableObject();
        const wrapped = wrapAsTransformable(object, emptyTransformerSet);

        wrapped.one = "new value";
        assert.strictEqual(wrapped.one, "new value");
    });

    describe("should ignore inapplicable transformers", function () {
        it("for other objects", function () {
            const transformerSet = new TransformerSet();
            transformerSet.add(Transformer.forWrappedObject(new MutableObject(), "one", 0, () => "transformed"));

            const object = new MutableObject();
            const wrapped = wrapAsTransformable(object, transformerSet);

            assert.strictEqual(wrapped.one, object.one);
        });

        it("for other properties", function () {
            const transformerSet = new TransformerSet();
            const object = new MutableObject();
            const wrapped = wrapAsTransformable(object, transformerSet);

            transformerSet.add(Transformer.forWrappedObject(wrapped, "two", 0, () => "transformed"));

            assert.strictEqual(wrapped.one, object.one);
        });
    });

    it("should return transformed values", function () {
        const transformerSet = new TransformerSet();
        const object = new MutableObject();
        const wrapped = wrapAsTransformable(object, transformerSet);

        transformerSet.add(Transformer.forWrappedObject(wrapped, "one", 0, () => "transformed"));

        assert.strictEqual(wrapped.one, "transformed");
    });

    it("should pass arguments to transformers", function () {
        const transformerSet = new TransformerSet();
        const object = new MutableObject();
        const wrapped = wrapAsTransformable(object, transformerSet);

        let args;

        transformerSet.add(
            Transformer.forWrappedObject(wrapped, "one", 0, (...passedArgs) => {
                args = passedArgs;
                return "transformed";
            })
        );

        const ignored = wrapped.one;

        // (current, initial, target, property) => new
        assert.deepStrictEqual(args, ["baz", "baz", wrapped, "one"]);
    });

    it("should preserve the target's methods", function () {
        const object = new MutableObject();
        const wrapped = wrapAsTransformable(object, emptyTransformerSet);

        assert.strictEqual(wrapped.wasCalled, false);
        wrapped.method();
        assert.strictEqual(wrapped.wasCalled, true);
    });

    it("should preserve the target's inherited methods", function () {
        const object = new ChildMutableObject();
        const wrapped = wrapAsTransformable(object, emptyTransformerSet);

        assert.strictEqual(wrapped.wasCalled, false);
        wrapped.method();
        assert.strictEqual(wrapped.wasCalled, true);
    });

    it("should preserve methods from Object.prototype", function () {
        const object = new MutableObject();
        const wrapped = wrapAsTransformable(object, emptyTransformerSet);

        assert.strictEqual(wrapped.hasOwnProperty, Object.prototype.hasOwnProperty);
        assert.strictEqual(wrapped.hasOwnProperty("one"), true);
    });
});
