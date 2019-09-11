import {interfaces} from 'inversify'
import { BindingProxy } from './BindingProxy';
import { FluentMethods } from './FluentMethods';
import { FluentMethodParameters } from './FluentMethodParameters';


export interface IProxyCalledFactory{
    create(bindingId:number):IProxyCalled
}

export interface IProxyCalled{
    called<T extends FluentMethods>(call:T,args:FluentMethodParameters<T>):void
}
export class FluentProxy{
    private static bindingId=0;
    constructor(private proxyCalledFactory:IProxyCalledFactory){}
    bind:interfaces.Bind=<T>(sid:interfaces.ServiceIdentifier<T>)=>{
        FluentProxy.bindingId++;
        const proxyCalled=this.proxyCalledFactory.create(FluentProxy.bindingId);
        proxyCalled.called("bind",[sid]);
        return new BindingProxy<T>(proxyCalled); 
    }
    
}