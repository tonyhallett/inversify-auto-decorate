import { FluentMethodParameters } from "../../fluent_proxies/FluentMethodParameters";
import { FluentMethods } from "../../fluent_proxies/FluentMethods";
export type IFluentCall<T extends FluentMethods> = {
    method: T;
    arguments: FluentMethodParameters<T>;
};
