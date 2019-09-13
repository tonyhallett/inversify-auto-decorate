import { interfaces } from "inversify";
import { IProxyBinding } from "../../proxy binding/ProxyBinding";
import { IFluentSyntaxCall } from "../../proxy binding/SyntaxLastCall";
import { deleteInversifyMetadata } from "../../../inversifyCommon/inversifyMetadata";
import { IDecoratorDetail } from "./DecoratedBindingsManager";
export class FirstDecorator {
    private bindingInWhenOn!: interfaces.BindingInWhenOnSyntax<any>;
    private bindingTo!: interfaces.BindingToSyntax<any>;
    private serviceIdentifier: interfaces.ServiceIdentifier<any>;
    private decorator: any;
    constructor(private binding: IProxyBinding, private isManagedWhenCall: (whenCall: IFluentSyntaxCall<"when">) => boolean) {
        this.serviceIdentifier = binding.serviceIdentifier;
    }
    private copyScope() {
        if (this.binding.inSyntaxLastCall && this.binding.inSyntaxLastCall.lastCall) {
            (this.bindingInWhenOn as any)[this.binding.inSyntaxLastCall.lastCall.method]();
        }
    }
    private copyWhenOrTargetDefault() {
        if (this.binding.whenSyntaxLastCall && this.binding.whenSyntaxLastCall.lastCall) {
            this.lastRealBindingWhenCall = this.binding.whenSyntaxLastCall.lastCall;
            this.copyLastRealBindingWhenCall();
        }
        else {
            this.bindingInWhenOn.whenTargetIsDefault();
        }
    }
    public lastRealBindingWhenCall: IFluentSyntaxCall<"when"> | undefined;
    private copyLastRealBindingWhenCall() {
        (this.bindingInWhenOn as any)[this.lastRealBindingWhenCall!.method](...this.lastRealBindingWhenCall!.arguments);
    }
    private bindToDecorator(decorator: any) {
        this.decorator = decorator;
        this.bindingInWhenOn = this.bindingTo.to(this.decorator);
    }
    private setUpBinding(decorator: any) {
        this.bindingTo = this.binding.bindMethods.bind(this.serviceIdentifier);
        this.bindToDecorator(decorator);
        this.matchRealBinding();
    }
    private matchRealBinding() {
        this.copyScope();
        this.copyWhenOrTargetDefault();
    }
    private initialise(decorator: any) {
        this.setUpBinding(decorator);
        this.handleRealBindingChanges();
    }
    private handleRealBindingChanges() {
        this.keepScopeAlignedWithRealBinding();
        this.keepWhenAlignedWithRealBinding();
    }
    private keepWhenAlignedWithRealBinding() {
        this.binding.interceptWhen(whenCall => {
            if (this.isManagedWhenCall(whenCall)) {
                return true;
            }
            this.lastRealBindingWhenCall = whenCall;
            this.copyLastRealBindingWhenCall();
            return false;
        });
    }
    private keepScopeAlignedWithRealBinding() {
        this.binding.interceptIn(inCall => {
            (this.bindingInWhenOn as any)[inCall.method]();
            return true;
        });
    }
    public setDecorator(decorator: IDecoratorDetail) {
        if (this.decorator === undefined) {
            this.initialise(decorator);
        }
        else {
            deleteInversifyMetadata(this.decorator);
            this.ensureOn();
            this.bindToDecorator(decorator);
        }
    }
    private switchedOff = false;
    private ensureOn() {
        if (this.switchedOff) {
            this.copyLastRealBindingWhenCall();
            this.switchedOff = false;
        }
    }
    switchOff() {
        this.switchedOff = true;
        this.bindingInWhenOn.whenTargetTagged("Do_Not_Match_As_Switched_Off", true);
    }
    remove() {
        deleteInversifyMetadata(this.decorator);
    }
}
