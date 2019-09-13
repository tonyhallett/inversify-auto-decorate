import { interfaces } from "inversify";
import { IBindingCalls } from "./IBindingCalls";
import { IFluentCall } from "./IFluentCall";
import { FluentStage } from "../../fluent_proxies/FluentStage";
import { BindMethods } from "../BindMethods";
import { BindingCalls } from "./BindingCalls";
import { SyntaxLastCall, ISyntaxLastCall, SyntaxLastCallType, SyntaxLastCallInterceptor } from "./SyntaxLastCall";
import { getAllFuncs } from "../../javascriptHelpers";

export interface IProxyBinding{
    interceptWhen(interceptor:SyntaxLastCallInterceptor<"when">):void;
    interceptIn(interceptor:SyntaxLastCallInterceptor<"in">):void
    serviceIdentifier:interfaces.ServiceIdentifier<any>
    bindingId:number,
    moduleId:number,
    bindingCalls:IBindingCalls,
    bindMethods:BindMethods,
    whenSyntaxLastCall: ISyntaxLastCall<'when'> | undefined;
    inSyntaxLastCall: ISyntaxLastCall<'in'> | undefined;
    fluentCalled(call:IFluentCall<any>): void
    
}


export class ProxyBinding implements IProxyBinding {
    public bindingCalls: IBindingCalls;
    public serviceIdentifier: interfaces.ServiceIdentifier<any>;
    public toSyntaxLastCall!: ISyntaxLastCall<'to'>;
    public inSyntaxLastCall: ISyntaxLastCall<'in'> | undefined;
    public whenSyntaxLastCall: ISyntaxLastCall<'when'> | undefined;
    public onSyntaxLastCall: ISyntaxLastCall<'on'> | undefined;
    private whenInterceptor:SyntaxLastCallInterceptor<"when">|undefined;
    private inInterceptor:SyntaxLastCallInterceptor<"in">|undefined;
    constructor(public moduleId: number, public bindingId: number, args: any[], public bindMethods: BindMethods) {
        this.serviceIdentifier = args[0];
        this.toSyntaxLastCall = new SyntaxLastCall('to', bindMethods.bind(this.serviceIdentifier));
        this.bindingCalls = new BindingCalls(bindingId, args);
    }
    //#region type guards
    private isFluentStageMatch(fluentStage:FluentStage|undefined,startsWith:SyntaxLastCallType){
        if(!fluentStage){
            return false;
        }
        const funcs = getAllFuncs(fluentStage);
        for(let i=0;i<funcs.length;i++){
            if(funcs[i].startsWith(startsWith)){
                return true;
            }
        }
        return false;
    }
    
    private isIn(fluentStage:FluentStage|undefined): fluentStage is interfaces.BindingInSyntax<any> {
        return this.isFluentStageMatch(fluentStage,"in");
    }
    private isWhen(fluentStage:FluentStage|undefined): fluentStage is interfaces.BindingWhenSyntax<any> {
        return this.isFluentStageMatch(fluentStage,"when");
    }
    private isOn(fluentStage:FluentStage|undefined): fluentStage is interfaces.BindingOnSyntax<any> {
        return this.isFluentStageMatch(fluentStage,"on");
    }
    //#endregion
    interceptWhen(interceptor: SyntaxLastCallInterceptor<"when">):void{
        if (this.whenSyntaxLastCall) {
            this.whenSyntaxLastCall.intercept(interceptor);
        }else{
            this.whenInterceptor=interceptor;
        }
    }
    interceptIn(interceptor: SyntaxLastCallInterceptor<"in">):void{
        if (this.inSyntaxLastCall) {
            this.inSyntaxLastCall.intercept(interceptor);
        }else{
            this.inInterceptor=interceptor;
        }
    }
    fluentCalled(call: IFluentCall<any>): void {
        this.bindingCalls.calls.push(call);
        const syntaxLastCalls = [this.toSyntaxLastCall, this.inSyntaxLastCall, this.whenSyntaxLastCall, this.onSyntaxLastCall];
        let applied = false;
        for (let i = 0; i < syntaxLastCalls.length; i++) {
            const syntaxLastCall = syntaxLastCalls[i];
            if (syntaxLastCall) {
                if (syntaxLastCall.canApply(call)) {
                    applied = true;
                    const nextFluentStage = syntaxLastCall.apply(call);
                    if (!(this.inSyntaxLastCall && this.whenSyntaxLastCall && this.onSyntaxLastCall)) {
                        if (this.isIn(nextFluentStage)) {
                            /* istanbul ignore else */
                            if (this.inSyntaxLastCall === undefined) {
                                this.inSyntaxLastCall = new SyntaxLastCall("in", nextFluentStage);
                                if(this.inInterceptor){
                                    this.inSyntaxLastCall.intercept(this.inInterceptor);
                                }
                            }
                        }
                        if (this.isWhen(nextFluentStage)) {
                            if (this.whenSyntaxLastCall === undefined) {
                                this.whenSyntaxLastCall = new SyntaxLastCall("when", nextFluentStage);
                                if(this.whenInterceptor){
                                    this.whenSyntaxLastCall.intercept(this.whenInterceptor);
                                }
                            }
                        }
                        if (this.isOn(nextFluentStage)) {
                            if (this.onSyntaxLastCall === undefined) {
                                this.onSyntaxLastCall = new SyntaxLastCall("on", nextFluentStage);
                            }
                        }
                    }
                    break;
                }
            }
        }
        
        if(!applied) throw new Error("Did not apply fluent call");
    }
}
