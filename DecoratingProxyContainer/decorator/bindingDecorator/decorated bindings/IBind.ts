import { interfaces } from "inversify";
export interface IBind {
    bind(): interfaces.BindingToSyntax<any>;
}
