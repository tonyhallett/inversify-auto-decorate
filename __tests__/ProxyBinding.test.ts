import { ProxyBinding } from "../DecoratingProxyContainer/decorator/proxy binding/ProxyBinding";
import { IFluentCall } from "../DecoratingProxyContainer/decorator/proxy binding/IFluentCall";

describe("ProxyBinding",()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
    })
    describe("binding in the constructor", ()=>{
        it("Should bind in the constructor", ()=>{
            const mockBindMethods={
                bind:jest.fn()
            }
            const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
            expect(mockBindMethods.bind).toHaveBeenCalledWith("Sid");
        })
        it("Should have toSyntaxLastCall upon construction",()=>{
            const mockToStage={};
            const mockBindMethods={
                bind:()=>mockToStage
            }
            const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
            const toSyntaxLastCall=proxyBinding.toSyntaxLastCall;
            expect(toSyntaxLastCall.type).toBe('to');
            expect(toSyntaxLastCall.lastCall).toBeUndefined();
            expect(toSyntaxLastCall.fluentStage).toEqual(mockToStage);
        })
    })
    
    it("should use the to syntax when a to method", ()=>{
        class MockWhenOn{
            whenTargetTagged(){}
            onActivation(){}
        }
        const mockToStage={
            toConstantValue:jest.fn().mockReturnValue(new MockWhenOn())
        };
        const mockBindMethods={
            bind:()=>mockToStage
        }
        const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
        const toCall:IFluentCall<"toConstantValue">={
            method:"toConstantValue",
            arguments:[5]
        }
        proxyBinding.fluentCalled(toCall)
        expect(mockToStage.toConstantValue).toHaveBeenCalledWith(5);
        expect(proxyBinding.toSyntaxLastCall.lastCall).toEqual(toCall);
        expect(proxyBinding.whenSyntaxLastCall!.type).toBe('when');
        expect(proxyBinding.onSyntaxLastCall!.type).toBe('on');

    })
    it("should use the when syntax when a when method", ()=>{
        
        class MockOn{
            onActivation(){}
        }
        class MockWhenOn{
            when(){
                return new MockOn();
            }
            onActivation(){}
        }
        const mockWhenOn=new MockWhenOn();
        jest.spyOn(mockWhenOn,"when")

        const mockToStage={
            toConstantValue:jest.fn().mockReturnValue(mockWhenOn)
        };
        const mockBindMethods={
            bind:()=>mockToStage
        }
        const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
        const toCall:IFluentCall<"toConstantValue">={
            method:"toConstantValue",
            arguments:[5]
        }
        const mockWhenConstraint=()=>{};
        const whenCall:IFluentCall<any>={
            method:"when",
            arguments:[mockWhenConstraint]
        }
        proxyBinding.fluentCalled(toCall);
        proxyBinding.fluentCalled(whenCall);
        expect(proxyBinding.whenSyntaxLastCall!.lastCall).toEqual(whenCall);
        expect(mockWhenOn.when).toHaveBeenCalledWith(mockWhenConstraint);
        
    })
    it("should use the on syntax when onActivation", ()=>{
        class MockWhen{
            when(){}
        }
        
        class MockWhenOn{
            when(){}
            onActivation(){
                return new MockWhen()
            }
        }
        const mockWhenOn=new MockWhenOn();
        jest.spyOn(mockWhenOn,"onActivation")
        const mockToStage={
            toConstantValue:jest.fn().mockReturnValue(mockWhenOn)
        };
        const mockBindMethods={
            bind:()=>mockToStage
        }
        const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
        const toCall:IFluentCall<"toConstantValue">={
            method:"toConstantValue",
            arguments:[5]
        }
        const mockOnActivation=()=>{};
        const onCall:IFluentCall<any>={
            method:"onActivation",
            arguments:[mockOnActivation]
        }
        proxyBinding.fluentCalled(toCall);
        proxyBinding.fluentCalled(onCall);
        expect(proxyBinding.onSyntaxLastCall!.lastCall).toEqual(onCall);
        expect(mockWhenOn.onActivation).toHaveBeenCalledWith(mockOnActivation);
    })
    it("should use the in syntax when an in method", ()=>{
        class SomeClass{}
        
        class MockWhenOn{
            when(){}
            onActivation(){}
        }
        
        class MockWhenInOn{
            when(){}
            onActivation(){}
            inSingletonScope(){
                return new MockWhenOn();
            }
        }
        const mockWhenInOn=new MockWhenInOn();
        jest.spyOn(mockWhenInOn,"inSingletonScope");
        const mockToStage={
            to:jest.fn().mockReturnValue(mockWhenInOn)
        };
        const mockBindMethods={
            bind:()=>mockToStage
        }
        const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
        const toCall:IFluentCall<"to">={
            method:"to",
            arguments:[SomeClass]
        }
        const inCall:IFluentCall<"inSingletonScope">={
            method:"inSingletonScope",
            arguments:[]
        }
        proxyBinding.fluentCalled(toCall);
        proxyBinding.fluentCalled(inCall);
        expect(proxyBinding.inSyntaxLastCall!.lastCall).toEqual(inCall);
        expect(mockWhenInOn.inSingletonScope).toHaveBeenCalled();
    })
    it("should throw if cannot apply a fluent call",()=>{
        
        const mockToStage={
            toConstantValue:()=>{}
        };
        const mockBindMethods={
            bind:()=>mockToStage
        }
        const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
        
        expect(()=>proxyBinding.fluentCalled({method:"when",arguments:[]})).toThrowError();
        
    })
    it("Should call again and overwrite", ()=>{
        class SomeClass{}
        
        class MockWhenOn{
            whenTargetTagged(){}
            onActivation(){}
        }
        class MockInWhenOn{
            whenTargetTagged(){}
            onActivation(){}
            inSingletonScope(){}
        }
        const mockToStage={
            toConstantValue:jest.fn().mockReturnValue(new MockWhenOn()),
            to:jest.fn().mockReturnValue(new MockInWhenOn())
        };
        const mockBindMethods={
            bind:()=>mockToStage
        }
        const proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
        const toCall:IFluentCall<"toConstantValue">={
            method:"toConstantValue",
            arguments:[5]
        }
        const toCall2:IFluentCall<"to">={
            method:"to",
            arguments:[SomeClass]
        }
        
        proxyBinding.fluentCalled(toCall);
        const whenSyntaxLastCall = proxyBinding.whenSyntaxLastCall;
        const onSyntaxLastCall = proxyBinding.onSyntaxLastCall
        expect(whenSyntaxLastCall).toBeDefined();
        expect(onSyntaxLastCall).toBeDefined();
        expect(proxyBinding.inSyntaxLastCall).toBeUndefined();

        proxyBinding.fluentCalled(toCall2);
        expect(mockToStage.to).toHaveBeenCalledWith(SomeClass);
        expect(proxyBinding.toSyntaxLastCall.lastCall).toEqual(toCall2);

        expect(proxyBinding.whenSyntaxLastCall).toEqual(whenSyntaxLastCall);
        expect(proxyBinding.onSyntaxLastCall).toEqual(onSyntaxLastCall);

        expect(proxyBinding.inSyntaxLastCall).toBeDefined();
    })
    describe("intercepting when", ()=>{
        //will have to fake the setup such that
        //have when but not stage that follows and that the stage will not be created
        //will need to show that the fluent stage does not get called
        //should show that does get called if do not intercept
        describe("not intercepting",()=>{
            class SomeClass{}
            class MockInWhenOn{
                onActivation(){}
                inSingletonScope(){}
                when(){}
            }
            const mockToStage={
                to:jest.fn().mockReturnValue(new MockInWhenOn())
            };
            const toCall:IFluentCall<"to">={
                method:"to",
                arguments:[SomeClass]
            }
            let proxyBinding:ProxyBinding
            beforeEach(()=>{
                const mockBindMethods={
                    bind:()=>mockToStage
                }
                proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
                proxyBinding.fluentCalled(toCall)
            })
            it("should call the fluent stage",()=>{
                expect(mockToStage.to).toHaveBeenCalledWith(SomeClass);
                
            })
            it("should have the last call", ()=>{
                expect(proxyBinding.toSyntaxLastCall.lastCall).toEqual(toCall);
            })
            it("should have the next stages",()=>{
                expect(proxyBinding.inSyntaxLastCall).toBeDefined();
                expect(proxyBinding.onSyntaxLastCall).toBeDefined();
                expect(proxyBinding.whenSyntaxLastCall).toBeDefined();
            })
        });
        
        [true,false].forEach((before)=>{
            describe(`intercept ${before?"before":"after"} when syntax created`,()=>{
                let proxyBinding:ProxyBinding;
                const whenCallInterceptor=jest.fn();
                const whenTargetNamedCall:IFluentCall<"whenTargetNamed">={
                    method:"whenTargetNamed",
                    arguments:["some name"]
                }
                class MockNextStage{
                    onActivation(){}
                }
                class MockWhen{
                    whenTargetNamed(){
                        return new MockNextStage();
                    }
                }
                let mockWhen:MockWhen
                beforeEach(()=>{
                    mockWhen=new MockWhen()
                    const mockToStage={
                        toConstantValue:jest.fn().mockReturnValue(mockWhen)
                    };
                    jest.spyOn(mockWhen,"whenTargetNamed");
                    const toCall:IFluentCall<"toConstantValue">={
                        method:"toConstantValue",
                        arguments:[5]
                    }
                    
                    const mockBindMethods={
                        bind:()=>mockToStage
                    }
                    proxyBinding=new ProxyBinding(1,1,["Sid"],mockBindMethods as any);
                    if(before){
                        proxyBinding.interceptWhen(whenCallInterceptor);
                    }
                    proxyBinding.fluentCalled(toCall);
                    expect(proxyBinding.whenSyntaxLastCall).toBeDefined();
                    if(!before){
                        proxyBinding.interceptWhen(whenCallInterceptor);
                    }
                    proxyBinding.fluentCalled(whenTargetNamedCall);
                })
                it("should call the interceptor",()=>{
                    expect(whenCallInterceptor).toHaveBeenCalledWith(whenTargetNamedCall);
                })
                it("should not call the when fluent stage",()=>{
                    expect(mockWhen.whenTargetNamed).not.toHaveBeenCalled();
                })
                it("should not set the next stage",()=>{
                    expect(proxyBinding.onSyntaxLastCall).toBeUndefined();
                })
            })
        })
    })
})