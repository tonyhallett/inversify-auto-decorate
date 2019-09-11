import { FluentMethods } from './FluentMethods';
import { interfaces } from 'inversify';

export type FluentMethodToMethod<T extends FluentMethods> =
    T extends keyof interfaces.BindingInSyntax<any> ? interfaces.BindingInSyntax<any>[T] :
    T extends keyof interfaces.BindingOnSyntax<any> ? interfaces.BindingOnSyntax<any>[T] :
    T extends keyof interfaces.BindingToSyntax<any> ? interfaces.BindingToSyntax<any>[T] :
    T extends keyof interfaces.BindingWhenSyntax<any> ? interfaces.BindingWhenSyntax<any>[T] :
    T extends keyof Pick<interfaces.Container,"bind"> ? Pick<interfaces.Container,"bind">[T]:
    "object"

export type Parameters<T> = T extends (... args: infer T) => any ? T : never; 
export type FluentMethodParameters<T extends FluentMethods> = Parameters<FluentMethodToMethod<T>>;
