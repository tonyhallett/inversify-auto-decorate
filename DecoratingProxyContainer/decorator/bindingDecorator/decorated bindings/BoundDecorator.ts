import { interfaces } from "inversify";
import { BindMethods } from "../../BindMethods";
import { IBind } from "./IBind";
import { setNamed } from "../../../inversifyCommon/metadataHelper";
export class BoundDecorator implements IBind {
    private binding!: interfaces.BindingInWhenOnSyntax<any>;
    public isBound = false;
    constructor(private serviceIdentifier: interfaces.ServiceIdentifier<any>, public decoratorModuleId: number, private decorator: interfaces.Newable<any>, private decoratorBindMethods: BindMethods) { }
    setUp(whenTargetNamed: string, named: string): void {
        this.binding.whenTargetNamed(whenTargetNamed);
        setNamed(named,this.decorator,this.serviceIdentifier);
        //could I unbind all decorators and just rebind with decorate(named) ?
    }
    bindDecorator() {
        this.binding = this.bind().to(this.decorator);
        this.isBound = true;
    }
    bind = () => {
        return this.decoratorBindMethods.bind(this.serviceIdentifier);
    };
}
