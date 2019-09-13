import { interfaces } from "inversify";
import {  IModuleFluentProxyCalled, IModuleFluentProxyFactory } from "../fluent_proxies/ModuleFluentProxy";
import { ModuleRegistryArguments } from "./ModuleRegistryArguments";
import { IUndecoratedBinder } from "./undecorated binder/undecoratedBinder";
import { BindMethods } from "./BindMethods";
import { FluentMethodParameters } from "../fluent_proxies/FluentMethodParameters";
import { FluentMethods } from "../fluent_proxies/FluentMethods";
import { IFluentCall } from "./proxy binding/IFluentCall";
import { IBindingDecorator } from "./bindingDecorator/bindingDecorator";
export interface IDecorator{
    setLastDecoratorConstructedFirst(lastFirst:boolean):void;
    unload(moduleIds:number[]):void;
    getModuleRegistryArguments(moduleId:number,bind:interfaces.Bind,unbind:interfaces.Unbind, isBound:interfaces.IsBound, rebind:interfaces.Rebind,getDecorator?:true):ModuleRegistryArguments
}


export class Decorator implements IDecorator, IModuleFluentProxyCalled {
    
    constructor(
        private moduleFluentProxyFactory:IModuleFluentProxyFactory,
        private undecoratedBinder:IUndecoratedBinder,
        private bindingDecorator:IBindingDecorator
        ) { }
    private decorated(decoratorModuleId:number,serviceIdentifier: interfaces.ServiceIdentifier<any>, decorator: interfaces.Newable<any>,decoratorBindMethods:BindMethods){
        const decorableBindings=this.undecoratedBinder.getDecorableBindings(serviceIdentifier);
        if(decorableBindings.length>0){
            this.bindingDecorator.decorate(decorableBindings,decoratorModuleId,decorator,decoratorBindMethods);
        }else{
            this.bindingDecorator.addDecorator(decoratorModuleId, serviceIdentifier,decorator,decoratorBindMethods);
        }
    }
    called<T extends FluentMethods>(moduleId: number,serviceIdentifier:interfaces.ServiceIdentifier<any>, bindingId: number, method: T, args:FluentMethodParameters<T>) {
        const call:IFluentCall<T> = {method,arguments:args}
        if(method!=="bind"){
            const binding = this.undecoratedBinder.getBinding(moduleId, bindingId);
            if(binding){
                binding.fluentCalled(call);
                //give decorator opportunity to take over
                const didDecorate:boolean=this.bindingDecorator.decorateExisting(binding);
                if(didDecorate){
                    this.undecoratedBinder.removeBinding(moduleId,binding);
                }
            }else{
                //binding decorator is decorating the binding
                this.bindingDecorator.fluentCalled(serviceIdentifier, bindingId,call);
            }
        }else{
            this.undecoratedBinder.fluentCalled(moduleId, bindingId, call);
        }
        
    }
    getModuleRegistryArguments(moduleId: number, bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind, getDecorator?: true): ModuleRegistryArguments {
        const bindMethods:BindMethods={
            bind,unbind,rebind
        }
        this.undecoratedBinder.addModule(moduleId, bindMethods);
        
        const args: ModuleRegistryArguments = {
            isBound,
            unbind: (serviceIdentifier) => {
                unbind(serviceIdentifier);
                this.bindingDecorator.unbind(serviceIdentifier);
                this.undecoratedBinder.unbind(serviceIdentifier);
            },
            rebind: (serviceIdentifier) => {
                args.unbind(serviceIdentifier);
                return args.bind(serviceIdentifier);
            },
            bind: (serviceIdentifier) => {
                this.undecoratedBinder.ensureModule(moduleId, bindMethods);
                const moduleFluentProxy = this.moduleFluentProxyFactory.create(moduleId, serviceIdentifier,this);
                return moduleFluentProxy.bind(serviceIdentifier);
            },
            decorate: null as any,
            decoratedCount:null as any
        };
        if (getDecorator) {
            args.decorate = (serviceIdentifier,decorator)=>{
                this.decorated(moduleId,serviceIdentifier,decorator,bindMethods);
            }
            args.decoratedCount = (serviceIdentifier,isDecorating)=>{
                return this.bindingDecorator.decoratedCount(serviceIdentifier,isDecorating);
            }
        }
        return args;
    }
    setLastDecoratorConstructedFirst(lastFirst:boolean){
        this.bindingDecorator.lastDecoratorConstructedFirst=lastFirst;
    }
    
    unload(moduleIds:number[]) {
        this.undecoratedBinder.unload(moduleIds);
        this.bindingDecorator.unload(moduleIds);
    }
}
