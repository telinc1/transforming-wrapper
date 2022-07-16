import {ISelector} from "./ISelector";
import {SingleSelector} from "./SingleSelector";

type TransformerCallback<T extends object, K extends keyof T> = (
    current: T[K],
    initial: T[K],
    target: T,
    property: K
) => T[K];

export class Transformer<T extends object = any, K extends keyof T = any> {
    public readonly target: ISelector;
    public readonly property: K;
    public readonly priority: number;
    public readonly callback: TransformerCallback<T, K>;

    protected constructor(target: ISelector, property: K, priority: number, callback: TransformerCallback<T, K>) {
        this.target = target;
        this.property = property;
        this.priority = priority;
        this.callback = callback;
    }

    public static forWrappedObject<S extends object, U extends keyof S>(
        target: S,
        property: U,
        priority: number,
        callback: TransformerCallback<S, U>
    ): Transformer {
        return new Transformer(new SingleSelector(target), property, priority, callback);
    }
}
