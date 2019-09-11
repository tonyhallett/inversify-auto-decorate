import { interfaces } from "inversify";
import { IBind } from "./IBind";
import { IBinder } from "./IBinder";
export class RequestedBinding {
    constructor(private serviceIdentifier: interfaces.ServiceIdentifier<any>, private rootName: string, private binder: IBinder) { }
    public createdRequestedBinding = false;
    public requestedRoot!: string;
    public bind:IBind|undefined;
    public create() {
        this.bind=this.binder.getBind();
        this.bind.bind().toDynamicValue(context => {
                return context.container.getNamed(this.serviceIdentifier, this.requestedRoot);
            }).whenTargetNamed(this.rootName);
            this.createdRequestedBinding = true;
        
    }
}
