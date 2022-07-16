import {Transformer} from "./Transformer";

export class TransformerSet {
    protected transformers: Transformer[];

    constructor() {
        this.transformers = [];
    }

    public all(): Transformer[] {
        return this.transformers.slice();
    }

    public add(transformer: Transformer): this {
        const {transformers} = this;

        if (transformers.includes(transformer)) {
            return this;
        }

        let insertAt = transformers.length;

        for (let index = transformers.length - 1; index >= 0; index -= 1) {
            if (transformers[index].priority >= transformer.priority) {
                break;
            }

            insertAt = index;
        }

        transformers.splice(insertAt, 0, transformer);
        return this;
    }

    public delete(transformer: Transformer): boolean {
        const index = this.transformers.indexOf(transformer);

        if (index >= 0) {
            this.transformers.splice(index, 1);
            return true;
        }

        return false;
    }

    public clear(): void {
        this.transformers.length = 0;
    }

    public reduce<U>(callback: (previousValue: U, transformer: Transformer) => U, initialValue: U): U {
        return this.transformers.reduce(callback, initialValue);
    }
}
