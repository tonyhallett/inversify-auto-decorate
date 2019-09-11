import { interfaces } from "inversify";
import { decorate } from "../container_modules/DecoratingContainerModule";
export interface ModuleRegistryArguments {
    bind: interfaces.Bind;
    unbind: interfaces.Unbind;
    rebind: interfaces.Rebind;
    isBound: interfaces.IsBound;
    decorate: decorate;
    decoratedCount(serviceIdentifier:interfaces.ServiceIdentifier<any>,isDecorating?:boolean):number
}
