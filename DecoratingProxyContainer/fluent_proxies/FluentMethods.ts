import { interfaces } from 'inversify';
export type FluentMethods = keyof Pick<interfaces.Container, "bind"> | keyof interfaces.BindingInSyntax<any> | keyof interfaces.BindingOnSyntax<any> | keyof interfaces.BindingWhenSyntax<any> | keyof interfaces.BindingToSyntax<any>;
