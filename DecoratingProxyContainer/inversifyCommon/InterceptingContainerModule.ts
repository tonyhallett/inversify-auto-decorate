import { interfaces } from "inversify";
//#region container modules
export abstract class InterceptingContainerModule implements interfaces.ContainerModule {
    id: number;
    registry: interfaces.ContainerModuleCallBack = (bind, unbind, isBound, rebind) => {
        this.isBound = isBound;
        this.bind = bind;
        this.unbind = unbind;
        this.rebind = rebind;
        this.containerLoaded();
    };
    abstract containerLoaded(): void;
    isBound!: interfaces.IsBound;
    bind!: interfaces.Bind;
    unbind!: interfaces.Unbind;
    rebind!: interfaces.Rebind;
    constructor(public interceptedContainerModule: interfaces.ContainerModule) {
        this.id = this.interceptedContainerModule.id;
    }
}
