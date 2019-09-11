import { IFluentCall } from "../DecoratingProxyContainer/decorator/proxy binding/IFluentCall";
import { BindingProxy } from "../DecoratingProxyContainer/fluent_proxies/BindingProxy";
import { getAllFuncs } from "../DecoratingProxyContainer/javascriptHelpers";

describe("BindingProxy",()=>{
    it("should pass the method name and arguments to the proxyCalled",()=>{
        const mockProxyCalled={
            called:jest.fn()
        }
        const bindingProxy=new BindingProxy(mockProxyCalled);
        const syntaxMethods=getAllFuncs(bindingProxy).filter(n=>n!=="constructor");
        const methodsAndArgs=syntaxMethods.map(sm=>{
            const method=(bindingProxy as any)[sm].bind(bindingProxy);
            const requiredNumberOfArguments=method.length;
            const args=[];
            for(let i=0;i<requiredNumberOfArguments;i++){
                args.push(i);
            }
            method(...args);
            return {
                sm,
                args
            }
        })
        methodsAndArgs.forEach(margs=>{
            expect(mockProxyCalled.called).toHaveBeenCalledWith(margs.sm,margs.args);
        })
    })
})