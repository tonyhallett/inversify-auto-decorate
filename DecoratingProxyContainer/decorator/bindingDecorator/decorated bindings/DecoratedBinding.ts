import { interfaces, getServiceIdentifierAsString, decorate, tagged, METADATA_KEY } from "inversify";
import { IFluentCall } from "../../proxy binding/IFluentCall";
import { IProxyBinding } from "../../proxy binding/ProxyBinding";
import { IFluentSyntaxCall } from "../../proxy binding/SyntaxLastCall";
import { cloneInjectable, clonePropertyMetadata, cloneConstructorParametersMetadata } from "../../../inversifyCommon/cloner";
import { IDecoratorDetail } from "./DecoratedBindingsManager";
import { FirstDecorator } from "./FirstDecorator";
import { OtherDecorators } from "./OtherDecorators";

export interface IDecoratedBinding{
    unbind():void;
    unload(moduleIds: number[]): boolean;
    fluentCalled(call: IFluentCall<any>): void
    addDecorator(newDecoratorDetail: IDecoratorDetail): void;
}

export class DecoratedBinding implements IDecoratedBinding {
    private serviceIdentifierAsString: string;
    private decoratedRootKey = "DecoratedRoot";
    private decoratedRootValue: string;
    private firstDecorator!: FirstDecorator;
    private otherDecorators = new OtherDecorators();
    private whenRootCall: IFluentCall<"whenTargetTagged">;
    private allowRealWhenThrough = false;
    constructor(private decoratorDetails: IDecoratorDetail[], private lastDecoratorConstructedFirst: boolean, private suffix: number, private binding: IProxyBinding) {
        this.serviceIdentifierAsString = getServiceIdentifierAsString(binding.serviceIdentifier);
        this.decoratedRootValue = `${this.serviceIdentifierAsString}_Root_${this.suffix}`;
        this.whenRootCall = { method: 'whenTargetTagged', arguments: [this.decoratedRootKey, this.decoratedRootValue] };
        const isManagedWhenCall = (whenCall: IFluentSyntaxCall<"when">) => {
            return whenCall === this.whenRootCall || this.allowRealWhenThrough;
        };
        this.firstDecorator = new FirstDecorator(this.binding, isManagedWhenCall);
        this.setChain();
    }
    private resetRealBindingWhen() {
        if (this.firstDecorator.lastRealBindingWhenCall) {
            this.allowRealWhenThrough = true;
            this.binding.whenSyntaxLastCall!.apply(this.firstDecorator.lastRealBindingWhenCall!);
            this.allowRealWhenThrough = false;
        }
    }
    private revertToRealBindingOnly() {
        this.resetRealBindingWhen();
        this.firstDecorator.switchOff();
    }
    private setChain() {
        const numDecorators = this.decoratorDetails.length;
        if (numDecorators === 0) {
            this.revertToRealBindingOnly();
        }
        else {
            this.chainDecorators();
        }
    }
    private chainDecorators() {
        const numDecorators = this.decoratorDetails.length;
        this.decoratorDetails.forEach((dd, i) => {
            const decoratorServiceIdentifier = this.getDecoratorServiceIdentifier(i, numDecorators);
            const clonedDecorator = this.cloneAndDecorate(dd.decorator, i, numDecorators, this.decoratedRootValue);
            if (i === 0) {
                this.firstDecorator.setDecorator(clonedDecorator);
            }
            else {
                this.otherDecorators.bindDecorator(clonedDecorator, decoratorServiceIdentifier, dd.decoratorBindMethods);
            }
            this.binding.whenSyntaxLastCall!.apply(this.whenRootCall);
        });
    }
    private resetChain() {
        //unbind all bindings except decorator1 
        this.otherDecorators.remove();
        this.setChain();
    }
    private getDecoratorInjectServiceIdentifier(decoratorIndex: number, numDecorators: number): interfaces.ServiceIdentifier<any> {
        const isLast = numDecorators - 1 === decoratorIndex;
        if (isLast) {
            return this.binding.serviceIdentifier;
        }
        return `${this.serviceIdentifierAsString}_Decorator${decoratorIndex + 2}_${this.suffix}`;
    }
    private getDecoratorServiceIdentifier(decoratorIndex: number, numDecorators: number): interfaces.ServiceIdentifier<any> {
        if (decoratorIndex === 0) {
            return this.binding.serviceIdentifier;
        }
        return this.getDecoratorInjectServiceIdentifier(decoratorIndex - 1, numDecorators);
    }
    private cloneAndDecorate(decorator: any, decoratorIndex: number, numDecorators: number, decoratedRootValue: string): any {
        //for now manually using Reflect instead of metadata reader - for cloning - note that metadatareader supports writing, when read you change what provide
        //so aside from not supporting custom metadata reader - it should be ok to work directly with Reflect
        //given that a custom metadatareader would need to know how annotation sets Reflect 
        //as not currently supporting custom, will clone metadata by writing to Reflect ( either directly or via decorator method) and will be present when builtin metadata reader reads
        const decoratorClone = cloneInjectable(decorator);
        clonePropertyMetadata(decorator, decoratorClone);
        let injectIndex = -1;
        //inject next in chain
        cloneConstructorParametersMetadata(decorator, decoratorClone, (index, metadata) => {
            if (metadata.key === METADATA_KEY.INJECT_TAG && metadata.value === this.binding.serviceIdentifier) {
                injectIndex = index;
                return { key: METADATA_KEY.INJECT_TAG, value: this.getDecoratorInjectServiceIdentifier(decoratorIndex, numDecorators) };
            }
            return metadata;
        });
        const isLast = numDecorators - 1 === decoratorIndex;
        if (isLast) {
            this.tagLastClonedDecoratorToRoot(decoratorClone, decoratedRootValue, injectIndex);
        }
        return decoratorClone;
    }
    private tagLastClonedDecoratorToRoot(decoratorClone: any, decoratedRootValue: string, parameterIndex: number) {
        decorate(tagged(this.decoratedRootKey, decoratedRootValue) as any, decoratorClone, parameterIndex);
    }
    fluentCalled(call: IFluentCall<any>): void {
        this.binding.fluentCalled(call);
    }
    addDecorator(newDecoratorDetail: IDecoratorDetail): void {
        if (this.lastDecoratorConstructedFirst) {
            this.decoratorDetails = [newDecoratorDetail].concat(this.decoratorDetails);
        }
        else {
            this.decoratorDetails.push(newDecoratorDetail);
        }
        this.resetChain();
    }
    unload(moduleIds: number[]): boolean {
        if (moduleIds.some(mid => mid === this.binding.moduleId)) {
            //first decorator is bound with the binding bind so need to remove
            this.otherDecorators.remove();
            return true;
        }
        this.decoratorDetails = this.decoratorDetails.filter(dd => {
            return !moduleIds.some(mid => mid === dd.decoratorModuleId);
        });
        this.resetChain();
        return false;
    }
    unbind() {
        this.otherDecorators.remove();
        this.firstDecorator.remove();
    }
}
