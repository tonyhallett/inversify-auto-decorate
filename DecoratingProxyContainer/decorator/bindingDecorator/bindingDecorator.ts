import { interfaces } from "inversify";
import { IFluentCall } from "../proxy binding/IFluentCall";
import { BindMethods } from "../BindMethods";
import { DecoratedBindingsManager } from "./decorated bindings/DecoratedBindingsManager";
import { IProxyBinding } from "../proxy binding/ProxyBinding";

export interface IBindingDecorator{
    decoratedCount(serviceIdentifier: string | symbol | interfaces.Newable<any> | interfaces.Abstract<any>,isDecorating?:boolean): number;
    unload(moduleIds: number[]):void;
    lastDecoratorConstructedFirst: boolean;
    decorateExisting(binding: IProxyBinding): boolean;
    decorate(bindings: IProxyBinding[], decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods:BindMethods):void
    addDecorator(decoratorModuleId:number,serviceIdentifier: interfaces.ServiceIdentifier<any>, decorator:interfaces.Newable<any>, decoratorBindMethods:BindMethods):void
    fluentCalled(serviceIdentifier:interfaces.ServiceIdentifier<any>, bindingId: number,call:IFluentCall<any>):void;
    unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>):void;
    

}
export class BindingDecorator implements IBindingDecorator{
    private decoratedBindingsLookup:Map<interfaces.ServiceIdentifier<any>,DecoratedBindingsManager> = new Map();
    private getOrCreateDecoratedBindings(serviceIdentifier: interfaces.ServiceIdentifier<any>){
        let decoratedBindings:DecoratedBindingsManager
        if(this.decoratedBindingsLookup.has(serviceIdentifier)){
            decoratedBindings = this.decoratedBindingsLookup.get(serviceIdentifier)!;
        }else{
            decoratedBindings = new DecoratedBindingsManager(this.lastDecoratorConstructedFirst);
            this.decoratedBindingsLookup.set(serviceIdentifier,decoratedBindings);
        }
        return decoratedBindings;
    }
    lastDecoratorConstructedFirst!: boolean;
    decoratedCount(serviceIdentifier: string | symbol | interfaces.Newable<any> | interfaces.Abstract<any>,isDecorating:boolean=false): number {
        if(this.decoratedBindingsLookup.has(serviceIdentifier)){
            return this.decoratedBindingsLookup.get(serviceIdentifier)!.decoratedCount(isDecorating);
        }else{
            return 0;
        }
    }
    //currently not decorating, returns true if has a decorator for service identifier
    decorateExisting(binding: IProxyBinding): boolean {
        if(this.decoratedBindingsLookup.has(binding.serviceIdentifier)){
            const decoratedBindings = this.decoratedBindingsLookup.get(binding.serviceIdentifier)!;
            decoratedBindings.decorateExisting(binding);
            return true;
        }
        return false;
    }
    //may or may not have already decorated
    addDecorator(decoratorModuleId:number,serviceIdentifier: interfaces.ServiceIdentifier<any>, decorator:interfaces.Newable<any>, decoratorBindMethods:BindMethods){
        const decoratedBindings:DecoratedBindingsManager = this.getOrCreateDecoratedBindings(serviceIdentifier);
        decoratedBindings.addDecorator(decoratorModuleId,decorator,decoratorBindMethods);
    }
    //this is when we call decorate and has not been bound yet, but root bindings exist
    decorate(decorableBindings: IProxyBinding[], decoratorModuleId: number,decorator: interfaces.Newable<any>,decoratorBindMethods:BindMethods): void {
        const decoratedBindings = this.getOrCreateDecoratedBindings(decorableBindings[0].serviceIdentifier);
        decoratedBindings.decorate(decorableBindings,decoratorModuleId,decorator,decoratorBindMethods)
    }
    fluentCalled(serviceIdentifier:interfaces.ServiceIdentifier<any>,bindingId: number, call:IFluentCall<any>) {
       const decoratedBindings = this.decoratedBindingsLookup.get(serviceIdentifier)!;
       decoratedBindings.fluentCalled(bindingId,call);
    }
    
    unbind(serviceIdentifier: string | symbol | interfaces.Newable<any> | interfaces.Abstract<any>): void {
        if(this.decoratedBindingsLookup.has(serviceIdentifier)){
            const remove=this.decoratedBindingsLookup.get(serviceIdentifier)!.unbind();
            if(remove){
                this.decoratedBindingsLookup.delete(serviceIdentifier);
            }
        }
    }
    unload(moduleIds: number[]){
        const newDecoratedBindingsLookup=new Map<interfaces.ServiceIdentifier<any>,DecoratedBindingsManager>();
        this.decoratedBindingsLookup.forEach((db,key)=>{
            const remove=db.unload(moduleIds);
            if(!remove){
                newDecoratedBindingsLookup.set(key,db);
            }
        })
        this.decoratedBindingsLookup=newDecoratedBindingsLookup;
    }
}
