import { interfaces, getServiceIdentifierAsString } from "inversify";
import { IFluentCall } from "../../proxy binding/IFluentCall";
import { BindMethods } from "../../BindMethods";
import { IProxyBinding } from "../../proxy binding/ProxyBinding";
import { BoundDecorators } from "./BoundDecorators";
import { DecoratedBindings } from "./DecoratedBindings";
import { RequestedBinding } from "./RequestedBinding";
import { IBinder } from "./IBinder";
import { IDecoratorNamer } from "./IDecoratorNamer";
import { IConstrainedCallback } from "./IConstrainedCallback";
export class DecoratedBindingsManager implements IDecoratorNamer, IBinder, IConstrainedCallback {
    
    private rootName = "Root";
    private boundDecorators: BoundDecorators;
    private decoratedBindings: DecoratedBindings;
    private requestedBinding: RequestedBinding;
    private serviceIdentifierAsString: string;
    constructor(lastDecoratorConstructedFirst: boolean, serviceIdentifier: interfaces.ServiceIdentifier<any>) {
        this.serviceIdentifierAsString = getServiceIdentifierAsString(serviceIdentifier);
        this.requestedBinding = new RequestedBinding(serviceIdentifier, this.rootName, this);
        this.decoratedBindings = new DecoratedBindings(this.serviceIdentifierAsString, this);
        this.boundDecorators = new BoundDecorators(lastDecoratorConstructedFirst, serviceIdentifier, this.rootName, this);
    }
    private setDecoratorChain() {
        if (!this.requestedBinding.createdRequestedBinding) {
            this.requestedBinding.create();
        }
        this.boundDecorators.setDecoratorChain();
    }
    //#region interfaces methods
    public getBind() {
        let bind = this.boundDecorators.getBind();
        if (!bind) {
            bind = this.decoratedBindings.getBind();
        }
        return bind!;
    }
    public getDecoratorName(decoratorSuffix: number) {
        return `${this.serviceIdentifierAsString}_${decoratorSuffix}`;
    }
    public getFirstDecorator = () => {
        const firstDecoratorName = this.boundDecorators.decoratedCount() === 0 ? this.rootName : this.getDecoratorName(0);
        return firstDecoratorName;
    };
    public constrainedCalled = (rootName: string) => {
        this.requestedBinding.requestedRoot = rootName;
    };
    //#endregion
    //#region decorating
    decorateExisting(binding: IProxyBinding) {
        this.decoratedBindings.create(binding);
        this.setDecoratorChain();
    }
    decorate(decorableBindings: IProxyBinding[], decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods): void {
        this.boundDecorators.addDecorator(decoratorModuleId, decorator, decoratorBindMethods);
        decorableBindings.forEach(b => this.decoratedBindings.create(b));
        this.setDecoratorChain();
    }
    addDecorator(decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods) {
        this.boundDecorators.addDecorator(decoratorModuleId, decorator, decoratorBindMethods);
        if (this.decoratedBindings.count() !== 0) {
            this.setDecoratorChain();
        }
    }
    decoratedCount(isDecorating:boolean) {
        if(isDecorating&&this.decoratedBindings.count()===0){
            return 0;
        }
        return this.boundDecorators.decoratedCount();
    }
    //#endregion
    fluentCalled(bindingId: number, call: IFluentCall<any>) {
        this.decoratedBindings.fluentCalled(bindingId, call);
    }
    unload(moduleIds: number[]):boolean {
        let {unloadedBinds,noDecoratorsRemain} = this.boundDecorators.unload(moduleIds);
        let {unloadedBinds:unloadedBindingBinds,noBindingsRemain } = this.decoratedBindings.unload(moduleIds);
        
        const remove:boolean=noDecoratorsRemain&&noBindingsRemain;
        if(!remove){
            unloadedBinds=unloadedBinds.concat(unloadedBindingBinds)
            if (this.requestedBinding.createdRequestedBinding) {
                if (unloadedBinds.find(b => this.requestedBinding.bind === b)) {
                    this.resetRequestedBinding();
                }
            }
            this.setDecoratorChain();
        }
        

        return remove;
    }
    private resetRequestedBinding(){
        this.requestedBinding.createdRequestedBinding = false;
        this.requestedBinding.bind = undefined;
    }
    unbind(): boolean {
        this.decoratedBindings.unbind();
        this.resetRequestedBinding();
        this.boundDecorators.requiresRebind=true;
        if(this.boundDecorators.decoratedCount()===0){
            return true;
        }
        return false;
    }
}
