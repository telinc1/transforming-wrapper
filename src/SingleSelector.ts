import {ISelector} from "./ISelector";

export class SingleSelector implements ISelector {
    protected target: object;

    constructor(target: object) {
        this.target = target;
    }

    public matches(input: unknown): boolean {
        return this.target === input;
    }
}
