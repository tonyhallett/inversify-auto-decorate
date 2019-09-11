import { interfaces } from "inversify";
import { IFluentCall } from "./IFluentCall";
export interface IBindingCalls {
    bindingId: number;
    calls: IFluentCall<any>[];
    serviceIdentifier: interfaces.ServiceIdentifier<any>;
}
