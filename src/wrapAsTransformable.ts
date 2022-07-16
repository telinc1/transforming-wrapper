import {MutableProperties} from "./ITransformable";
import {TransformerSet} from "./TransformerSet";
import {TransformingWrapper} from "./TransformingWrapper";

type WrappedReadonlyObject<T extends object> = TransformingWrapper<T> & Readonly<T>;
type WrappedMutableObject<T extends object, M extends keyof T> = Omit<WrappedReadonlyObject<T>, M> & Pick<T, M>;

/**
 * Creates a union of the properties in the static `mutableProperties`
 * array for a given instance type, provided the instance type implements
 * ITransformable.
 */
type ExtractMutable<T extends {constructor: new (...args: any[]) => T}> = T["constructor"] extends MutableProperties<T>
    ? T["constructor"]["mutableProperties"][number]
    : never;

/** Final type of an object properly wrapped in a TransformingWrapper. */
export type WrappedObject<T extends {constructor: new (...args: any[]) => T}> = WrappedMutableObject<
    T,
    ExtractMutable<T>
>;

/**
 * Wraps an ITransformable object into a TransformingWrapper linked to the
 * given TransformerSet.
 *
 * Properties not defined as mutable by the target will be made readonly.
 */
export function wrapAsTransformable<T extends {constructor: new (...args: any[]) => T}>(
    target: T,
    transformers: TransformerSet
): WrappedObject<T> {
    return new TransformingWrapper(target, transformers) as any;
}
