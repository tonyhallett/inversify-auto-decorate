import { interfaces } from "inversify";
import { IBindingCalls } from "./IBindingCalls";
import { IFluentCall } from "./IFluentCall";
export class BindingCalls implements IBindingCalls {
    calls: IFluentCall<any>[] = [];
    serviceIdentifier: interfaces.ServiceIdentifier<any>;
    constructor(public bindingId: number, bindArgs: any[]) {
        this.calls.push({ method: "bind", arguments: bindArgs });
        this.serviceIdentifier = bindArgs[0];
    }
}
