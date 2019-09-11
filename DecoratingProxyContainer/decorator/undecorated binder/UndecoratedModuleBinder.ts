import { interfaces } from "inversify";
import { IFluentCall } from "../proxy binding/IFluentCall";
import { ProxyBinding, IProxyBinding } from "../proxy binding/ProxyBinding";
import { BindMethods } from "../BindMethods";

export interface IUndecoratedModuleBinder{
    removeBinding(binding: IProxyBinding):boolean;
    getBinding(bindingId: number):IProxyBinding|undefined
    decorating(serviceIdentifier: interfaces.ServiceIdentifier<any>):IProxyBinding[]
    fluentCalled(bindingId: number, call:IFluentCall<any>):void
    unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>):boolean
    moduleId:number
    bindMethods:BindMethods
}
export class UndecoratedModuleBinder implements IUndecoratedModuleBinder {
    private bindings: IProxyBinding[] = [];
    constructor(public moduleId: number, public bindMethods: BindMethods) { }
    removeBinding(binding: IProxyBinding) {
        this.bindings = this.bindings.filter(b => b !== binding);
        return this.bindings.length===0;
    }
    getBinding(bindingId: number) {
        return this.bindings.find(b => b.bindingId === bindingId);
    }
    decorating(serviceIdentifier: interfaces.ServiceIdentifier<any>): IProxyBinding[] {
        let keepBindings: IProxyBinding[] = [];
        let removedBindings: IProxyBinding[] = [];
        this.bindings.forEach(b => {
            //we do not allow decorating where there has been no bind(sid).to.....
            if (b.serviceIdentifier === serviceIdentifier && b.bindingCalls.calls.length > 1) {
                removedBindings.push(b);
            }
            else {
                keepBindings.push(b);
            }
        });
        this.bindings = keepBindings;
        return removedBindings;
    }
    fluentCalled(bindingId: number, call: IFluentCall<any>): void {
        //is either bind call or fluentCall that already have
        if (call.method === "bind") {
            this.bindings.push(new ProxyBinding(this.moduleId, bindingId, call.arguments, this.bindMethods));
        }
        else {
            const binding = this.bindings.find(b => b.bindingId === bindingId)!;
            binding.fluentCalled(call);
        }
    }
    unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>):boolean {
        this.bindings = this.bindings.filter(b => {
            b.serviceIdentifier !== serviceIdentifier;
        });
        return this.bindings.length===0;
    }
}
