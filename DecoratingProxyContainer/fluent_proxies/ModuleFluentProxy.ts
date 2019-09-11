import { interfaces } from "inversify";
import { FluentProxy, IProxyCalled, IProxyCalledFactory } from "./bindingFluentProxy";
import { FluentMethodParameters } from "./FluentMethodParameters";
import { FluentMethods } from "./FluentMethods";

export interface IModuleFluentProxyFactory{
    create(moduleId: number,serviceIdentifier:interfaces.ServiceIdentifier<any>, moduleFluentProxyCalled: IModuleFluentProxyCalled):IModuleFluentProxy
}
export interface IModuleFluentProxy{
    bind(serviceIdentifier: interfaces.ServiceIdentifier<any>):interfaces.BindingToSyntax<any>
}
export class ModuleFluentProxyFactory implements IModuleFluentProxyFactory{
    create(moduleId: number,serviceIdentifier:interfaces.ServiceIdentifier<any>, moduleFluentProxyCalled: IModuleFluentProxyCalled): IModuleFluentProxy {
        return new ModuleFluentProxy(moduleId,serviceIdentifier,moduleFluentProxyCalled);
    }

}

class ModuleFluentProxy implements IProxyCalledFactory, IBindingProxyCalled, IModuleFluentProxy {
    private fluentProxy: FluentProxy;
    constructor(private moduleId: number,private serviceIdentifier:interfaces.ServiceIdentifier<any>, private moduleFluentProxyCalled: IModuleFluentProxyCalled) {
        this.fluentProxy = new FluentProxy(this);
    }
    called<T extends FluentMethods>(bindingId: number, method: T, args:FluentMethodParameters<T>): void {
        this.moduleFluentProxyCalled.called(this.moduleId,this.serviceIdentifier, bindingId, method, args);
    }
    create(bindingId: number): IProxyCalled {
        return new ProxyCalled(bindingId, this);
    }
    bind(serviceIdentifier: interfaces.ServiceIdentifier<any>) {
        return this.fluentProxy.bind(serviceIdentifier);
    }
}
export interface IModuleFluentProxyCalled{
    called<T extends FluentMethods>(moduleId:number,serviceIdentifier:interfaces.ServiceIdentifier<any>,bindingId:number,method:T,args:FluentMethodParameters<T>):void
}

export interface IBindingProxyCalled{
    called<T extends FluentMethods>(bindingId:number,method:T,args:FluentMethodParameters<T>):void
}
export class ProxyCalled implements IProxyCalled{
    called<T extends FluentMethods>(method: T, args: FluentMethodParameters<T>): void {
        this.bindingProxyCalled.called(this.bindingId,method,args)
    }
    constructor(private bindingId:number,private bindingProxyCalled:IBindingProxyCalled){}

}
