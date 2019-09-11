import { interfaces } from 'inversify';
import { IProxyCalled } from './bindingFluentProxy';


export class BindingProxy<T> implements interfaces.BindingToSyntax<T>,interfaces.BindingWhenSyntax<T>,interfaces.BindingOnSyntax<T>,interfaces.BindingInSyntax<T> {
    constructor(private proxyCalled: IProxyCalled) { }
    //#region to methods
    to(constructor: new (...args: any[]) => T): interfaces.BindingInWhenOnSyntax<T> {
        this.proxyCalled.called("to", [constructor]);
        return this;
    }
    toSelf(): interfaces.BindingInWhenOnSyntax<T> {
        this.proxyCalled.called("toSelf", []);
        return this;
    }
    toConstantValue(value: T): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("toConstantValue", [value]);
        return this;
    }
    toDynamicValue(func: (context: interfaces.Context) => T): interfaces.BindingInWhenOnSyntax<T> {
        this.proxyCalled.called("toDynamicValue", [func]);
        return this;
    }
    toConstructor<T2>(constructor: interfaces.Newable<T2>): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("toConstructor", [constructor]);
        return this;
    }
    toFactory<T2>(factory: interfaces.FactoryCreator<T2>): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("toFactory", [factory]);
        return this;
    }
    toFunction(func: T): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("toFunction", [func]);
        return this;
    }
    toAutoFactory<T2>(serviceIdentifier: string | symbol | interfaces.Newable<T2> | interfaces.Abstract<T2>): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("toAutoFactory", [serviceIdentifier]);
        return this;
    }
    toProvider<T2>(provider: interfaces.ProviderCreator<T2>): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("toProvider", [provider]);
        return this;
    }
    toService(service: string | symbol | interfaces.Newable<T> | interfaces.Abstract<T>): void {
        this.proxyCalled.called("toService", [service]);
    }
    //#endregion
    //#region in methods
    inSingletonScope(): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("inSingletonScope", []);
        return this;
    }
    inTransientScope(): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("inTransientScope", []);
        return this;
    }
    inRequestScope(): interfaces.BindingWhenOnSyntax<T> {
        this.proxyCalled.called("inRequestScope", []);
        return this;
    }
    //#endregion
    //#region when methods
    when(constraint: (request: interfaces.Request) => boolean): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("when", [constraint]);
        return this;
    }
    whenTargetNamed(name: string | number | symbol): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenTargetNamed", [name]);
        return this;
    }
    whenTargetIsDefault(): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenTargetIsDefault", []);
        return this;
    }
    whenTargetTagged(tag: string | number | symbol, value: any): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenTargetTagged", [tag, value]);
        return this;
    }
    whenInjectedInto(parent: string | Function): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenInjectedInto", [parent]);
        return this;
    }
    whenParentNamed(name: string | number | symbol): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenParentNamed", [name]);
        return this;
    }
    whenParentTagged(tag: string | number | symbol, value: any): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenParentTagged", [tag, value]);
        return this;
    }
    whenAnyAncestorIs(ancestor: string | Function): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenAnyAncestorIs", [ancestor]);
        return this;
    }
    whenNoAncestorIs(ancestor: string | Function): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenNoAncestorIs", [ancestor]);
        return this;
    }
    whenAnyAncestorNamed(name: string | number | symbol): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenAnyAncestorNamed", [name]);
        return this;
    }
    whenAnyAncestorTagged(tag: string | number | symbol, value: any): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenAnyAncestorTagged", [tag, value]);
        return this;
    }
    whenNoAncestorNamed(name: string | number | symbol): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenNoAncestorNamed", [name]);
        return this;
    }
    whenNoAncestorTagged(tag: string | number | symbol, value: any): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenNoAncestorTagged", [tag, value]);
        return this;
    }
    whenAnyAncestorMatches(constraint: (request: interfaces.Request) => boolean): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenAnyAncestorMatches", [constraint]);
        return this;
    }
    whenNoAncestorMatches(constraint: (request: interfaces.Request) => boolean): interfaces.BindingOnSyntax<T> {
        this.proxyCalled.called("whenNoAncestorMatches", [constraint]);
        return this;
    }
    //#endregion
    onActivation(fn: (context: interfaces.Context, injectable: T) => T): interfaces.BindingWhenSyntax<T> {
        this.proxyCalled.called("onActivation", [fn]);
        return this;
    }
}
