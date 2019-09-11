import { interfaces } from "inversify";
export interface BindMethods {
    bind: interfaces.Bind;
    unbind: interfaces.Unbind;
    rebind: interfaces.Rebind;
}
