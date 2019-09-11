import {  interfaces, id } from "inversify";
export type decorate=<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, decorator: interfaces.Newable<T>)=> void
export type decoratedCount=(serviceIdentifier: interfaces.ServiceIdentifier<any>,isDecorating?:boolean)=> number
export type DecoratingContainerModuleCallBack = (bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind, decorate:decorate, decoratedCount:decoratedCount) => void;

export interface DecoratingContainerModule {
    id: number;
    registry: DecoratingContainerModuleCallBack;
}

export abstract class DecoratingContainerModuleClass implements DecoratingContainerModule{
    id= id();                
    registry: DecoratingContainerModuleCallBack=(bind,unbind,isBound,rebind,decorate,decoratedCount)=>{
        this.isBound=isBound;
        this.bind=bind;
        this.unbind=unbind;
        this.rebind=rebind;
        this.decorate=decorate;
        this.decoratedCount=decoratedCount;
        this.containerLoaded();

    }
    abstract containerLoaded():void
    //non-null assertion - be sure to load before accessing
    isBound!:interfaces.IsBound
    bind!:interfaces.Bind
    unbind!:interfaces.Unbind
    rebind!:interfaces.Rebind
    decorate!:decorate
    decoratedCount!:decoratedCount;

}
export class OneShotDecoratingContainerModule extends DecoratingContainerModuleClass{
    constructor(private readonly callback:DecoratingContainerModuleCallBack){
        super();
    }
    containerLoaded=()=>{
        this.callback(this.bind,this.unbind,this.isBound,this.rebind,this.decorate,this.decoratedCount);
    }
}