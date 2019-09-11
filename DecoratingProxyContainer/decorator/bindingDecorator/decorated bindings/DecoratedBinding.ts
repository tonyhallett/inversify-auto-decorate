import { IFluentCall } from "../../proxy binding/IFluentCall";
import { IProxyBinding } from "../../proxy binding/ProxyBinding";
import { IBind } from "./IBind";
import { IConstrainedCallback } from "./IConstrainedCallback";
import { interfaces } from "inversify";
import { IFluentSyntaxCall } from "../../proxy binding/SyntaxLastCall";
export class DecoratedBinding implements IBind {
    private constrainedBinding!: interfaces.BindingInWhenOnSyntax<any>;
    public moduleId: number;
    constructor(private binding: IProxyBinding, private rootName: string, private constrainedCallback: IConstrainedCallback) {
        this.moduleId = binding.moduleId;
        this.createConstrained();
        this.createNamedRootBinding();
        this.binding.interceptWhen((whenCall:IFluentSyntaxCall<"when">)=>{
            (this.constrainedBinding[whenCall.method] as any)(...whenCall.arguments);
        })
    }
    
    createConstrained() {
        const serviceIdentifier = this.binding.serviceIdentifier;
        const binding = this.binding.bindMethods.bind(serviceIdentifier).toDynamicValue(context => {
            this.constrainedCallback.constrainedCalled(this.rootName);
            const firstDecorator = this.constrainedCallback.getFirstDecorator();
            return context.container.getNamed(serviceIdentifier, firstDecorator);
        });
        this.constrainedBinding=binding;
        const whenSyntaxLastCall=this.binding.whenSyntaxLastCall;
        if(whenSyntaxLastCall&&whenSyntaxLastCall.lastCall){
            (binding[whenSyntaxLastCall.lastCall.method] as any)(...whenSyntaxLastCall.lastCall.arguments)
        }else{
            (this.constrainedBinding as any).whenTargetIsDefault();
        }
    }
    
    createNamedRootBinding() {
        this.binding.whenSyntaxLastCall!.apply({method:"whenTargetNamed",arguments:[this.rootName]});
    }
    fluentCalled(call: IFluentCall<any>): void {
        this.binding.fluentCalled(call);
    }
    bind = () => {
        return this.binding.bindMethods.bind(this.binding.serviceIdentifier);
    };
}
