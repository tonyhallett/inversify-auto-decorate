import { Container, interfaces } from "inversify";
import { IDecorator, Decorator } from "../decorator/Decorator";
import { IDecoratingInterceptingContainerModuleFactory, DecoratingInterceptingContainerModuleFactory } from "../decorator/DecoratingInterceptingContainerModule";
import { ModuleFluentProxyFactory } from "../fluent_proxies/ModuleFluentProxy";
import { UndecoratedBinder } from "../decorator/undecorated binder/undecoratedBinder";
import { DecoratingContainerModule } from "./DecoratingContainerModule";
import { BindingDecorator } from "../decorator/bindingDecorator/bindingDecorator";


export class DecoratingModuleContainer extends Container{
    private decorator:IDecorator;
    private decoratingInterceptingContainerModuleFactory:IDecoratingInterceptingContainerModuleFactory;
    constructor(
        lastDecoratorConstructedFirst=true,
        options?:interfaces.ContainerOptions,
        ){
        super(options);
        this.decorator=new Decorator(
            new ModuleFluentProxyFactory(), 
            new UndecoratedBinder(),
            new BindingDecorator()
        ),
        this.decoratingInterceptingContainerModuleFactory=new DecoratingInterceptingContainerModuleFactory(),
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




