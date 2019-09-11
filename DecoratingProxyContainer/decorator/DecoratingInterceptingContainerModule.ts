import { interfaces } from "inversify";
import { IDecorator } from "./Decorator";
import { InterceptingContainerModule } from "../inversifyCommon/InterceptingContainerModule";
import { DecoratingContainerModule } from "../container_modules/DecoratingContainerModule";

export interface IDecoratingInterceptingContainerModuleFactory{
    create(interceptedContainerModule: interfaces.ContainerModule|DecoratingContainerModule,decorator: IDecorator):DecoratingInterceptingContainerModule
}
export class DecoratingInterceptingContainerModuleFactory implements IDecoratingInterceptingContainerModuleFactory{
    create(interceptedContainerModule: interfaces.ContainerModule,decorator: IDecorator){
        return new DecoratingInterceptingContainerModule(interceptedContainerModule,decorator);
    }
}
export class DecoratingInterceptingContainerModule extends InterceptingContainerModule {
    constructor(public interceptedContainerModule: interfaces.ContainerModule, private readonly decorator: IDecorator) {
        super(interceptedContainerModule);
    }
    containerLoaded(): void {
        if (this.interceptedContainerModule.registry.length <= 4) {
            const registryArguments = this.decorator.getModuleRegistryArguments(this.id, this.bind, this.unbind, this.isBound, this.rebind);
            this.interceptedContainerModule.registry(registryArguments.bind, registryArguments.unbind, registryArguments.isBound, registryArguments.rebind);
        }
        else {
            const registryArguments = this.decorator.getModuleRegistryArguments(this.id, this.bind, this.unbind, this.isBound, this.rebind, true);
            (this.interceptedContainerModule as DecoratingContainerModule).registry(registryArguments.bind, registryArguments.unbind, registryArguments.isBound, registryArguments.rebind, registryArguments.decorate,registryArguments.decoratedCount);
        }
    }
}
