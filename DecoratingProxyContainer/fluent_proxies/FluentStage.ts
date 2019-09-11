import { interfaces } from 'inversify';
export type FluentStage = interfaces.BindingInSyntax<any> | interfaces.BindingInWhenOnSyntax<any> | interfaces.BindingOnSyntax<any> | interfaces.BindingToSyntax<any> | interfaces.BindingWhenOnSyntax<any> | interfaces.BindingWhenSyntax<any>;
