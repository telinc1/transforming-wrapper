export type MutableProperties<T> = {mutableProperties: readonly (keyof T)[]};

export interface ITransformable<T extends new (...args: any) => InstanceType<T>> {
    constructor: {
        new (...args: any[]): any;
        mutableProperties: T extends MutableProperties<InstanceType<T>> ? T["mutableProperties"] : never;
    };
}
