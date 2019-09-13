import { interfaces } from "inversify";
import { IFluentCall } from "../../proxy binding/IFluentCall";
import { BindMethods } from "../../BindMethods";
import { IProxyBinding } from "../../proxy binding/ProxyBinding";
import { DecoratedBinding, IDecoratedBinding } from "./DecoratedBinding";


export interface IDecoratorDetail{
    decoratorModuleId: number, 
    decorator: interfaces.Newable<any>, 
    decoratorBindMethods: BindMethods
}


export class DecoratedBindingsManager {
    private decoratorDetails: IDecoratorDetail[] = [];
    //key bindingId
    private decoratedBindings:Map<number,IDecoratedBinding> = new Map();
    
    constructor(
        private lastDecoratorConstructedFirst: boolean, 
       ) {}
    private addDecoratorInOrder(decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods) {
        const newDecoratorDetail: IDecoratorDetail = {
            decorator,
            decoratorBindMethods,
            decoratorModuleId
        }
        if (this.lastDecoratorConstructedFirst) {
            this.decoratorDetails = [newDecoratorDetail].concat(this.decoratorDetails);
        }
        else {
            this.decoratorDetails.push(newDecoratorDetail);
        }
        return newDecoratorDetail;
    }
    //#region decorating
    //#region fluent method called

    //there are decorators to be applied
    decorateExisting(binding: IProxyBinding) {
        this.createdDecoratedBinding(binding);
    }
    private createdDecoratedBinding(binding: IProxyBinding){
        this.decoratedBindings.set(binding.bindingId,new DecoratedBinding([...this.decoratorDetails],this.lastDecoratorConstructedFirst,this.decoratedBindings.size,binding));
    }
    fluentCalled(bindingId: number, call: IFluentCall<any>) {
        this.decoratedBindings.get(bindingId)!.fluentCalled(call);
    }
    //#endregion
    //#region due to decorate call ( this class is constructed first time for sid)

    //these are those bindings that can decorate
    decorate(decorableBindings: IProxyBinding[], decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods): void {
        this.addDecorator(decoratorModuleId,decorator,decoratorBindMethods)
        decorableBindings.forEach(db=>this.createdDecoratedBinding(db));
    }
    addDecorator(decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods) {
        const newDecoratorDetail = this.addDecoratorInOrder(decoratorModuleId, decorator, decoratorBindMethods);
        //already decorating - chain needs to change
        if(this.decoratedBindings.size>0){
            this.decoratedBindings.forEach(db=>db.addDecorator(newDecoratorDetail));
        }
    }
    
    //#endregion
    decoratedCount(isDecorating:boolean): number {
        return isDecorating&&this.decoratedBindings.size===0?0:this.decoratorDetails.length;
    }
    //#endregion
    
    unload(moduleIds: number[]):boolean {
        this.decoratorDetails=this.decoratorDetails.filter(dd=>{
            return !moduleIds.some(mid=>mid===dd.decoratorModuleId);
        })
        
        this.decoratedBindings.forEach((db,key)=>{
            const remove = db.unload(moduleIds);
            if(remove){
                this.decoratedBindings.delete(key)
            }
        });
        const removeDecoratedBindingsManager = this.decoratedBindings.size===0&&this.decoratorDetails.length===0;
        return removeDecoratedBindingsManager;
    }
    
    unbind(): boolean {
        this.decoratedBindings.forEach((db)=>{
            db.unbind();
        })
        this.decoratedBindings.clear();
        return this.decoratorDetails.length === 0;
    }
}
