import { Container, interfaces } from "inversify";
import { IDecorator, Decorator } from "../decorator/Decorator";
import { IDecoratingInterceptingContainerModuleFactory, DecoratingInterceptingContainerModuleFactory } from "../decorator/DecoratingInterceptingContainerModule";
import { ModuleFluentProxyFactory } from "../fluent_proxies/ModuleFluentProxy";
import { UndecoratedBinder } from "../decorator/undecorated binder/undecoratedBinder";
import { DecoratingContainerModule } from "./DecoratingContainerModule";
import { BindingDecorator } from "../decorator/bindingDecorator/bindingDecorator";


//if only for modules should export factory function that return this type
export interface IDecoratingModuleContainer{
    load:interfaces.Container["load"];
    unload:interfaces.Container["unload"]
    //to do - need gets - better to exclude
}
export class DecoratingModuleContainer extends Container{
    //just for testing
    constructor(
        private readonly decorator:IDecorator,
        private decoratingInterceptingContainerModuleFactory:IDecoratingInterceptingContainerModuleFactory,
        lastDecoratorConstructedFirst:boolean
        ){
        super();
        this.decorator.setLastDecoratorConstructedFirst(lastDecoratorConstructedFirst);
        
    }
    
    public load(...modules: (interfaces.ContainerModule|DecoratingContainerModule)[]) {
        super.load(...modules.map(m=>this.decoratingInterceptingContainerModuleFactory.create(m, this.decorator)));
    }
    public unload(...modules: (interfaces.ContainerModule|DecoratingContainerModule)[]){
        super.unload(...modules as interfaces.ContainerModule[]);
        this.decorator.unload(modules.map(m=>m.id));
    }
}
export function createDecoratingModuleContainer(lastDecoratorConstructedFirst:boolean=true):DecoratingModuleContainer{
    return new DecoratingModuleContainer(
        new Decorator(
            new ModuleFluentProxyFactory(), 
            new UndecoratedBinder(),
            new BindingDecorator()
        ),
        new DecoratingInterceptingContainerModuleFactory(),
        lastDecoratorConstructedFirst
        );
}




