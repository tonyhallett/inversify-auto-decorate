import { interfaces} from "inversify";
import { IFluentCall } from "../proxy binding/IFluentCall";
import { IProxyBinding } from "../proxy binding/ProxyBinding";
import { BindMethods } from "../BindMethods";
import { UndecoratedModuleBinder, IUndecoratedModuleBinder } from "./UndecoratedModuleBinder";

export interface IUndecoratedBinder{
    
    unload(moduleIds: number[]):void
    removeBinding(moduleId: number, binding: IProxyBinding):void
    getBinding(moduleId: number, bindingId: number):IProxyBinding|undefined
    
    getDecorableBindings(serviceIdentifier: interfaces.ServiceIdentifier<any>):IProxyBinding[]
    fluentCalled(moduleId: number, bindingId: number, call:IFluentCall<any>):void
    unbind(serviceIdentifier:interfaces.ServiceIdentifier<any>):void
    addModule(moduleId: number, bindMethods:BindMethods):void
    ensureModule(moduleId: number, bindMethods: BindMethods):void
    
}
export class UndecoratedBinder implements IUndecoratedBinder{
    
    private moduleLookup: Map<number,IUndecoratedModuleBinder> = new Map();

    getBinding(moduleId: number, bindingId: number){
        return this.moduleLookup.get(moduleId)!.getBinding(bindingId);
    }
    getDecorableBindings(serviceIdentifier: interfaces.ServiceIdentifier<any>) {
        let bindings:IProxyBinding[]=[];
        this.moduleLookup.forEach((binder)=>{
            bindings=bindings.concat(binder.decorating(serviceIdentifier));
        })
        return bindings;
    }
    fluentCalled(moduleId: number, bindingId: number, call:IFluentCall<any>): void {
        const undecoratedModuleBinder:IUndecoratedModuleBinder = this.moduleLookup.get(moduleId)!;
        undecoratedModuleBinder.fluentCalled(bindingId, call);
    }
    removeBinding(moduleId: number, binding: IProxyBinding){
        const removedAllBindings = this.moduleLookup.get(moduleId)!.removeBinding(binding);
        if(removedAllBindings){
            this.moduleLookup.delete(moduleId);
        }
    }
    unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>): void {
        const newModuleLookup: Map<number,IUndecoratedModuleBinder> = new Map();
        this.moduleLookup.forEach((binder,moduleId)=>{
            const remove=binder.unbind(serviceIdentifier);
            if(!remove){
                newModuleLookup.set(moduleId,binder);
            }
        })
        this.moduleLookup=newModuleLookup;
    }
    unload(moduleIds: number[]){
        moduleIds.forEach(id=>{
            this.moduleLookup.delete(id);
        })
    }
    addModule(moduleId: number, bindMethods:BindMethods): void {
        this.moduleLookup.set(moduleId,new UndecoratedModuleBinder(
            moduleId, bindMethods
        ));
    }
    ensureModule(moduleId: number, bindMethods: BindMethods): void {
        if(!this.moduleLookup.has(moduleId)){
            this.addModule(moduleId,bindMethods);
        }
    }
}
