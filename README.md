# Transforming Wrapper

[![npm](https://img.shields.io/npm/v/transforming-wrapper)](https://www.npmjs.com/package/transforming-wrapper)

The transforming wrapper takes an object and allows you to intercept and modify the values of its properties using externally defined transformers. The original object is not changed. With TypeScript, you can also control which properties can be modified through the wrapped object.

Similar to using a `Proxy`, but providers stricter control and has far less overhead.

## Usage

Given the following object:

```javascript
const object = {property: 5};
```

First, create a `TransformerSet`:

```javascript
import {TransformerSet} from "transforming-wrapper";

const transformerSet = new TransformerSet();
```

Then, wrap the object:

```javascript
import {wrapAsTransformable} from "transforming-wrapper";

const wrapped = wrapAsTransformable(object, transformerSet);
```

Multiple wrapped objects can (and should!) use the same `TransformerSet`.

The `wrapped` object currently has the same behavior as the original `object`:

```javascript
object.property;    // > 5
wrapped.property;   // > 5
```

Add a transformer for this specific wrapped object:

```javascript
import {Transformer} from "transforming-wrapper";

transformerSet.add(Transformer.forWrappedObject(wrapped, "property", 0, () => 10));
```

A single transformer can target more than one wrapped object by using a custom implementation of `ISelector`.

The transformer will now intercept the property value:

```javascript
object.property;    // > 5
wrapped.property;   // > 10
```

Modifying the wrapped object modifies the original:

```javascript
wrapped.property = 20;

object.property;    // > 20
wrapped.property;   // > 10 (note: the transformer still runs!)
```

### TypeScript

In TypeScript, you can only wrap an object that implements `ITransformable`:

```typescript
import {wrapAsTransformable, ITransformable} from "transforming-wrapper";

class Test {
    public foo = 1;
    public bar = 2;
}

interface Test extends ITransformable<typeof Test> {}

// ...

const object = new Test();
const wrapped = wrapAsTransformable(object, transformerSet);
```

If you want to change the original object through the wrapped object, you must specify which properties are mutable. Properties not present in `mutableProperties` can't be changed through the wrapped object (but can still be targeted by transformers).

```typescript
import {wrapAsTransformable, ITransformable} from "transforming-wrapper";

class Test {
    public static readonly mutableProperties = ["canChange"] as const;

    public canChange = 1;
    public readOnly = 2;
}

interface Test extends ITransformable<typeof Test> {}

// ...

const object = new Test();
const wrapped = wrapAsTransformable(object, transformerSet);

wrapped.canChange = 10; // OK
wrapped.readOnly = 20;  // TypeScript error
```
