import { IFluentCall } from "./IFluentCall";
import { FluentStage } from "../../fluent_proxies/FluentStage";
import { interfaces } from "inversify";

export type SyntaxLastCallType='to'|'when'|'on'|'in';

export type SyntaxLastCallTypeToFluentMethod<T extends SyntaxLastCallType> =
T extends "to" ? keyof interfaces.BindingToSyntax<any> :
T extends "when" ? keyof interfaces.BindingWhenSyntax<any> :
T extends "on" ? keyof interfaces.BindingOnSyntax<any> :
T extends "in" ? keyof interfaces.BindingInSyntax<any> :
"object"

type MappedFluentStage={
    to:interfaces.BindingToSyntax<any>,
    when:interfaces.BindingWhenSyntax<any>,
    on:interfaces.BindingOnSyntax<any>,
    in:interfaces.BindingInSyntax<any>
}
export type IFluentSyntaxCall<T extends SyntaxLastCallType>=IFluentCall<SyntaxLastCallTypeToFluentMethod<T>>
export interface ISyntaxLastCall<T extends SyntaxLastCallType>{
    intercept(interceptor: (interceptedCall: IFluentCall<SyntaxLastCallTypeToFluentMethod<T>>) => void):void
    fluentStage:MappedFluentStage[T]
    type:T,
    lastCall:IFluentSyntaxCall<T>|undefined
    canApply(fluentCall:IFluentCall<any>):boolean
    apply(fluentCall:IFluentSyntaxCall<T>):FluentStage|undefined
}
export class SyntaxLastCall<T extends SyntaxLastCallType> implements ISyntaxLastCall<T> {
    private interceptor: ((interceptedCall: IFluentSyntaxCall<T>) => void)|undefined;
    intercept(interceptor: (interceptedCall: IFluentSyntaxCall<T>) => void) {
        this.interceptor=interceptor;
    }
    lastCall: IFluentSyntaxCall<T> | undefined;
    canApply(fluentCall: IFluentCall<any>): boolean {
        return fluentCall.method.startsWith(this.type);
    }
    apply(fluentCall: IFluentSyntaxCall<T>): FluentStage|undefined {
        if(this.interceptor){
            this.interceptor(fluentCall);
            return undefined;
        }
        
        this.lastCall = fluentCall;
        const nextStage= (this.fluentStage as any)[fluentCall.method](...fluentCall.arguments);
        return nextStage;
    }
    constructor(public type: T, public fluentStage: MappedFluentStage[T]) { }
}
