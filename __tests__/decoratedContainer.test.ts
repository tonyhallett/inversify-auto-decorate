import "reflect-metadata";
import { injectable, inject, named, interfaces, ContainerModule } from 'inversify'
import { createDecoratingModuleContainer } from "../DecoratingProxyContainer/container_modules/container";
import { OneShotDecoratingContainerModule } from "../DecoratingProxyContainer/container_modules/DecoratingContainerModule";
import { isUndefined } from "util";
describe('Decorating Container using Proxy', () => {
    beforeEach(()=>{
        FileStream.instanceId=0;
    })
    //#region streams
        
    interface IStream {
        read(): string
    }
    
    @injectable()
    class WithStream{
        constructor(@inject("IStream") public stream:IStream){}
        readStream(){
            return this.stream.read();
        }
    }
    @injectable()
    class RequestScopeWithStream{
        constructor(@inject("IStream") public stream:IStream, @inject(WithStream) public withStream:WithStream){}
    }
    @injectable()
    class WithFileStream{
        constructor(@inject("IStream") @named("File") public stream:IStream){}
        readStream(){
            return this.stream.read();
        }
    }
    @injectable()
    class WithMemoryStream{
        constructor(@inject("IStream") @named("Memory") public stream:IStream){}
        readStream(){
            return this.stream.read();
        }
    }
    //#region for decoration
    
    @injectable()
    class FileStream implements IStream{
        instanceId:number;
        constructor(){
            this.instanceId=FileStream.instanceId++
            
        }
        read(){
            return "FileStream"
        }
        static instanceId:number=0;
    }
    @injectable()
    class MemoryStream implements IStream{
        read(){
            return "MemoryStream"
        }
    }
    @injectable()
    class NetworkStream implements IStream{
        read(){
            return "NetworkStream"
        }
    }
    //#endregion
    //#region decorators
    @injectable()
    class EncryptedStream implements IStream {
        constructor(@inject("IStream") public baseStream: IStream) { }
        read(){
            return `Encrypted(${this.baseStream.read()})`;
        }
    }
    @injectable()
    class CompressedStream implements IStream {
        constructor(@inject("IStream") private baseStream: IStream) {  }
        read(){
            return `Compressed(${this.baseStream.read()})`;
        }
    }
    @injectable()
    class StreamWithArgument implements IStream{
        constructor(@inject("IStream") private baseStream: IStream, @inject("arg") private arg:string) {  }
        read(){
            return `StreamWithArgument[${this.arg}](${this.baseStream.read()})`;
        }
    }
    @injectable()
    class StreamWithArgumentDifferentIndex implements IStream{
        constructor(@inject("arg") private arg:string,@inject("IStream") private baseStream: IStream, ) {  }
        read(){
            return `StreamWithArgument[${this.arg}](${this.baseStream.read()})`;
        }
    }
    @injectable()
    class StreamWithArgumentAndPropertyInjection implements IStream{
        constructor(@inject("IStream") private baseStream: IStream, @inject("arg") private arg:string) {  }
        read(){
            return `StreamWithArgument[${this.arg}]WithProperty[${this.someProp}](${this.baseStream.read()})`;
        }

        @inject("SomeProp")
        private someProp!:number
    }
    //#endregion
    //#endregion
    function expectNoMatchingBindings(containerModuleGet:()=>any){
        expect(containerModuleGet).toThrow(/^No matching bindings found for serviceIdentifier: IStream/i)
    }
    describe("normal operation without decoration", ()=>{
        
        it("Should bind normally without decoration", ()=>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            const oneShot=new OneShotDecoratingContainerModule((bind)=>{
                bind("IStream").to(FileStream);
            })
            decoratingContainerModule.load(oneShot);
            expect(decoratingContainerModule.get("IStream")).toBeInstanceOf(FileStream);
        });
        it("Should work with onActivation without decoration", () =>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            let onActivationCalled = false;
            const oneShot=new OneShotDecoratingContainerModule((bind)=>{
                bind("IStream").to(FileStream).onActivation((context,fs)=>{
                    onActivationCalled=true;
                    return fs;
                })
            })
            decoratingContainerModule.load(oneShot);
            
            decoratingContainerModule.get("IStream");
            expect(onActivationCalled).toBe(true);
        })
        describe("scope",()=>{
            it("should work normally with singleton scope",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let onSingletonActivationCount=0;
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream).inSingletonScope().onActivation((c,fs)=>{
                        onSingletonActivationCount++;
                    })
                })
                
                decoratingContainerModule.load(bindModule);
                decoratingContainerModule.get("IStream");
                decoratingContainerModule.get("IStream");
        
                expect(onSingletonActivationCount).toBe(1);
            })
            it("should work normally with transient scope",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let onTransientActivationCount=0;
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream).inTransientScope().onActivation((c,fs)=>{
                        onTransientActivationCount++;
                    })
                })
                
                decoratingContainerModule.load(bindModule);
                decoratingContainerModule.get("IStream");
                decoratingContainerModule.get("IStream");
        
                expect(onTransientActivationCount).toBe(2);
            })
            it("Should work normally with request scope", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream).inRequestScope();
                    bind(RequestScopeWithStream).toSelf();
                    bind(WithStream).toSelf();
                })
                
                decoratingContainerModule.load(bindModule);
                const requestScopeWithStream=decoratingContainerModule.get<RequestScopeWithStream>(RequestScopeWithStream);
                const requestScopeStream=requestScopeWithStream.stream;
                
                const requestScopeStream2=requestScopeWithStream.withStream.stream;
                expect(requestScopeStream).toBe(requestScopeStream2);
            
            })
        })
        
        
        it("Should report isBound correctly after load", ()=>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            const oneShot=new OneShotDecoratingContainerModule((bind)=>{
                bind("IStream").to(FileStream);
            })
            decoratingContainerModule.load(oneShot);
            expect(oneShot.isBound("IStream")).toBe(true);
        })
        it("Should bind named normally without decoration", () =>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                bind(WithFileStream).toSelf();
                bind(WithMemoryStream).toSelf();
                bind("IStream").to(FileStream).whenTargetNamed("File");
                bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
            })
            
            
            decoratingContainerModule.load(bindModule);
            expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("FileStream")
            expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("MemoryStream")
        })
        it("should unload normally",()=>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            const keepModule=new OneShotDecoratingContainerModule((bind)=>{
                bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
            })
            const unloadModule=new OneShotDecoratingContainerModule((bind)=>{
                bind("IStream").to(FileStream).whenTargetNamed("File");
            })
            decoratingContainerModule.load(unloadModule,keepModule);
            decoratingContainerModule.unload(unloadModule);
            expect(decoratingContainerModule.getNamed("IStream","Memory")).toBeInstanceOf(MemoryStream);
            expectNoMatchingBindings(()=>decoratingContainerModule.getNamed("IStream","File"));

        })
        describe("should unbind normally",()=>{
            it("should unbind service identifier",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const unbindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                    bind("IStream").to(FileStream).whenTargetNamed("File");
                })
                
                decoratingContainerModule.load(unbindModule);
                unbindModule.unbind("IStream");
                expectNoMatchingBindings(()=>decoratingContainerModule.getNamed("IStream","File"));
                expectNoMatchingBindings(()=>decoratingContainerModule.getNamed("IStream","Memory"));
            })
            it("should unbind and re bind successfully",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const unbindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(MemoryStream);
                })
                const rebindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                
                decoratingContainerModule.load(unbindModule);
                unbindModule.unbind("IStream");
                decoratingContainerModule.load(rebindModule);
                expect(decoratingContainerModule.get("IStream")).toBeInstanceOf(FileStream);
            })
        })
        it("should rebind normally",()=>{
            const decoratingContainerModule = createDecoratingModuleContainer();
                const rebindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                })
                decoratingContainerModule.load(rebindModule);
                rebindModule.rebind("IStream").to(FileStream);
                expect(decoratingContainerModule.get("IStream")).toBeInstanceOf(FileStream);
        })
    })
    describe("decoration",()=>{
        describe("single decorator", ()=>{
            it("should permit additional decorator parameter injections", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new ContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](FileStream)");
            })

            
            it("should permit additional decorator parameter injections - different parameter order", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new ContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgumentDifferentIndex);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](FileStream)");
            })
            it("should permit decorator property injection",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new ContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg");
                    bind("SomeProp").toConstantValue(123);
                    d("IStream", StreamWithArgumentAndPropertyInjection);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg]WithProperty[123](FileStream)");
            })
            it("should decorate in 2 loads", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                
                decoratingContainerModule.load(bindModule);
                decoratingContainerModule.load(decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual('StreamWithArgument[The Arg](FileStream)');
            })
        })
        describe("Multiple decorators", ()=>{
            it("Should multiple decorate in single load - last decorator first", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer(true);
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule,decorateModule2);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("Encrypted(StreamWithArgument[The Arg](FileStream))")
            });
            
            it("Should multiple decorate in single load - first decorator first", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer(false);
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule,decorateModule2);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](Encrypted(FileStream))")
            })
            it("should multi decorate in 2 loads", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer(false);
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](FileStream)")
                decoratingContainerModule.load(decorateModule2);
                
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](Encrypted(FileStream))")
            })
            it("should return resolved singleton - no affect loading additional decorator after resolve", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer(false);
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream).inSingletonScope();
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](FileStream)")
                decoratingContainerModule.load(decorateModule2);
                
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("StreamWithArgument[The Arg](FileStream)")
            })
        })
        
        describe("decorating multiple roots", ()=>{
            it("Works with named root in one load", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind(WithFileStream).toSelf();
                    bind(WithMemoryStream).toSelf();
                    bind("IStream").to(FileStream).whenTargetNamed("File");
                    bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("StreamWithArgument[The Arg](FileStream)")
                expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("StreamWithArgument[The Arg](MemoryStream)")
            })
            it("Works with named root in two loads", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind(WithFileStream).toSelf();
                    bind(WithMemoryStream).toSelf();
                    bind("IStream").to(FileStream).whenTargetNamed("File");
                    bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                
                decoratingContainerModule.load(bindModule);
                decoratingContainerModule.load(decorateModule);
                expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("StreamWithArgument[The Arg](FileStream)")
                expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("StreamWithArgument[The Arg](MemoryStream)")
            })
        })
        
        describe("unloading/unbinding",()=>{
            describe("unloading decorators", ()=>{
                it("Should support unloading all decorators", () => {
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind(WithFileStream).toSelf();
                        bind(WithMemoryStream).toSelf();
                        bind("IStream").to(FileStream).inSingletonScope().whenTargetNamed("File");
                        bind("IStream").to(MemoryStream).inTransientScope().whenTargetNamed("Memory");
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    
                    decoratingContainerModule.load(bindModule);
                    decoratingContainerModule.load(decorateModule);

                    decoratingContainerModule.get<WithFileStream>(WithFileStream);
                    decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream);

                    decoratingContainerModule.unload(decorateModule);
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("FileStream")
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("MemoryStream")
                })
                it("Should support unloading all decorators and reloading - SINGLETON RETAINED", () => {
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind(WithFileStream).toSelf();
                        bind(WithMemoryStream).toSelf();
                        bind("IStream").to(FileStream).inSingletonScope().whenTargetNamed("File");
                        bind("IStream").to(MemoryStream).inTransientScope().whenTargetNamed("Memory");
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    
                    decoratingContainerModule.load(bindModule);
                    decoratingContainerModule.load(decorateModule);

                    const decoratedSingletonFileStream = decoratingContainerModule.get<WithFileStream>(WithFileStream).stream;
                    const decoratedSingletonFileStream2 = decoratingContainerModule.get<WithFileStream>(WithFileStream).stream;
                    expect(decoratedSingletonFileStream).toBe(decoratedSingletonFileStream2);

                    const decoratedMemoryStream = decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).stream;
                    const decoratedMemoryStream2 = decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).stream;
                    expect(decoratedMemoryStream).not.toBe(decoratedMemoryStream2);

                    decoratingContainerModule.unload(decorateModule);
                    decoratingContainerModule.load(decorateModule);
                    
                    const reloadDecoratedSingletonFileStream = decoratingContainerModule.get<WithFileStream>(WithFileStream).stream;
                    expect(reloadDecoratedSingletonFileStream).toBe(decoratedSingletonFileStream);
                })
                it("Should support unloading one decorator - SINGLETON DECORATOR RETAINED", () => {
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind(WithFileStream).toSelf();
                        bind(WithMemoryStream).toSelf();
                        bind("IStream").to(FileStream).inSingletonScope().whenTargetNamed("File")
                        bind("IStream").to(MemoryStream).inTransientScope().whenTargetNamed("Memory");
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        d("IStream",EncryptedStream);
                    })
                    const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        d("IStream",CompressedStream);
                    })
                    
                    decoratingContainerModule.load(bindModule,decorateModule,decorateModule2);
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("Compressed(Encrypted(FileStream))");
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("Compressed(Encrypted(MemoryStream))");
                    decoratingContainerModule.unload(decorateModule);
                    //singleton returned
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("Compressed(Encrypted(FileStream))");
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("Compressed(MemoryStream)");
                });
                it("Should support unloading one decorator and reloading", () => {
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind(WithFileStream).toSelf();
                        bind(WithMemoryStream).toSelf();
                        bind("IStream").to(FileStream).inSingletonScope().whenTargetNamed("File");
                        bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        d("IStream",EncryptedStream);
                    })
                    const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        d("IStream",CompressedStream);
                    })
                    const decorateModule3=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    
                    decoratingContainerModule.load(bindModule,decorateModule,decorateModule2);
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("Compressed(Encrypted(FileStream))");
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("Compressed(Encrypted(MemoryStream))");
                    decoratingContainerModule.unload(decorateModule);
                    //unload does not affect resolved singleton
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("Compressed(Encrypted(FileStream))");
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("Compressed(MemoryStream)");
                    decoratingContainerModule.load(decorateModule3);
                    //load does not affect resolved singleton
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("Compressed(Encrypted(FileStream))");
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("StreamWithArgument[The Arg](Compressed(MemoryStream))");
                });
            })
            describe("unloading the bind module",()=>{
                it("should throw if try to get after as normal",()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    const keepBindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind(WithFileStream).toSelf();
                        bind(WithMemoryStream).toSelf();
                        bind("IStream").to(FileStream).whenTargetNamed("File");
                    })
                    const unloadBindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    
                    decoratingContainerModule.load(unloadBindModule,keepBindModule,decorateModule);
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("StreamWithArgument[The Arg](FileStream)");
                    expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("StreamWithArgument[The Arg](MemoryStream)");
                    decoratingContainerModule.unload(unloadBindModule);
                    expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("StreamWithArgument[The Arg](FileStream)");
                    expectNoMatchingBindings(()=>decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream));
                })
                it("should be possible to unload and load another bind module to apply decorators to",()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    
                    const keepBindModule = new OneShotDecoratingContainerModule((bind)=>{
                        bind(WithStream).toSelf();
                    })
                    const unloadBindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(MemoryStream);
                    })
                    const loadBindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(FileStream);
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        d("IStream", CompressedStream);
                    })
                    decoratingContainerModule.load(keepBindModule,unloadBindModule,decorateModule);
                    expect(decoratingContainerModule.get<WithStream>(WithStream).readStream()).toEqual("Compressed(MemoryStream)")
                    decoratingContainerModule.unload(unloadBindModule);
                    decoratingContainerModule.load(loadBindModule);
                    expect(decoratingContainerModule.get<WithStream>(WithStream).readStream()).toEqual("Compressed(FileStream)")
                })
                it("should be possible to unload and reload the same module",()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    
                    const bindAndDecorate = new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind(WithStream).toSelf();
                        bind("IStream").to(MemoryStream);
                        d("IStream", CompressedStream);
                    })
                    
                    decoratingContainerModule.load(bindAndDecorate);
                    expect(decoratingContainerModule.get<WithStream>(WithStream).readStream()).toEqual("Compressed(MemoryStream)")
                    decoratingContainerModule.unload(bindAndDecorate);
                    decoratingContainerModule.load(bindAndDecorate);
                    expect(decoratingContainerModule.get<WithStream>(WithStream).readStream()).toEqual("Compressed(MemoryStream)")
                })
            })
            describe("unbind/rebind", ()=>{
                describe("unbind",()=>{
                    it("should unbind service identifier and keep decorators",()=>{
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const unbindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
                            bind("IStream").to(FileStream).whenTargetNamed("File");
                        })
                        const decoratorModule = new OneShotDecoratingContainerModule((bind,u,i,r,decorate,decorateCount)=>{
                            decorate("IStream",CompressedStream)
                        })
                        
                        decoratingContainerModule.load(unbindModule,decoratorModule);
                        unbindModule.unbind("IStream");
                        expect(decoratorModule.decoratedCount("IStream")).toEqual(1);
                        expect(decoratorModule.decoratedCount("IStream",true)).toEqual(0);
                        expectNoMatchingBindings(()=>decoratingContainerModule.getNamed("IStream","File"));
                        expectNoMatchingBindings(()=>decoratingContainerModule.getNamed("IStream","Memory"));
                    })
                    it("should unbind and re bind successfully",()=>{
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const unbindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(MemoryStream)
                        })
                        const decoratorModule = new OneShotDecoratingContainerModule((bind,u,i,r,decorate,decorateCount)=>{
                            decorate("IStream",CompressedStream)
                        })
                        
                        decoratingContainerModule.load(unbindModule,decoratorModule);
                        unbindModule.unbind("IStream");
                        unbindModule.bind("IStream").to(FileStream);
                        expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("Compressed(FileStream)");
                    })
                    it("should unbind and re bind successfully 2",()=>{
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const unbindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(MemoryStream)
                        })
                        const decoratorModule = new OneShotDecoratingContainerModule((bind,u,i,r,decorate,decorateCount)=>{
                            decorate("IStream",CompressedStream)
                        })
                        
                        decoratingContainerModule.load(unbindModule,decoratorModule);
                        decoratingContainerModule.unload(decoratorModule);
                        unbindModule.unbind("IStream");
                        decoratingContainerModule.load(decoratorModule);
                        unbindModule.bind("IStream").to(FileStream);
                        expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("Compressed(FileStream)");
                    })
                    it("should unbind and not affect other bindings", () => {
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const unbindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IKeepStream").to(FileStream);
                            bind("IStream").to(MemoryStream);
                        });
                        const decoratorModule = new OneShotDecoratingContainerModule((bind,u,i,r,decorate,decorateCount)=>{
                            decorate("IStream",CompressedStream);
                        });
                        
                        decoratingContainerModule.load(unbindModule,decoratorModule);
                        unbindModule.unbind("IStream");
                        expect(decoratingContainerModule.get("IKeepStream")).toBeInstanceOf(FileStream);
                    })
                })
                it("should rebind successfully",()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                        const rebindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(MemoryStream)
                        })
                        const decoratorModule = new OneShotDecoratingContainerModule((bind,u,i,r,decorate,decorateCount)=>{
                            decorate("IStream",CompressedStream)
                        })
                        
                        decoratingContainerModule.load(rebindModule,decoratorModule);
                        rebindModule.rebind("IStream").to(FileStream);
                        expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("Compressed(FileStream)");
                })
            })
            
        })
        
        describe("respecting normal behaviour", ()=>{
            //may decide to have container option so that applied to decorator instead
            it("Should support onActivation when decorated", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let onActivationCalled = false;
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream).onActivation((context, fs)=>{
                        onActivationCalled = true;
                    })
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                decoratingContainerModule.get<IStream>("IStream");
                expect(onActivationCalled).toBe(true);
            })
            it("Should report isBound correctly when decorated", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    bind("IStream").to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    bind("arg").toConstantValue("The Arg")
                    d("IStream", StreamWithArgument);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(bindModule.isBound("IStream")).toEqual(true);
            })
            describe("scope", ()=>{
                it("Should respect request scope on the root", ()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(FileStream).inRequestScope();
                        bind(RequestScopeWithStream).toSelf();
                        bind(WithStream).toSelf();
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        d("IStream", EncryptedStream);
                    })
                    decoratingContainerModule.load(bindModule,decorateModule);
                    const requestScopeWithStream=decoratingContainerModule.get<RequestScopeWithStream>(RequestScopeWithStream);
                    const requestScopeStream=(requestScopeWithStream.stream as EncryptedStream).baseStream as FileStream;
                    
                    const requestScopeStream2=(requestScopeWithStream.withStream.stream as EncryptedStream).baseStream as FileStream;
                    expect(requestScopeStream).toBe(requestScopeStream2);
                
                })
                it("Should respect singleton scope on the root", ()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    let onSingletonActivationCount=0;
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(FileStream).inSingletonScope().onActivation((c,fs)=>{
                            onSingletonActivationCount++;
                        })
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    decoratingContainerModule.load(bindModule,decorateModule);
                    decoratingContainerModule.get("IStream");
                    decoratingContainerModule.get("IStream");
            
                    expect(onSingletonActivationCount).toBe(1);
            
                    
                })
                
                it("Should respect singleton scope when container get before decoration", ()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    let onSingletonActivationCount=0;
                    const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(FileStream).inSingletonScope().onActivation((c,fs)=>{
                            onSingletonActivationCount++;
                        })
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    decoratingContainerModule.load(bindModule);
                    decoratingContainerModule.get("IStream");
                    decoratingContainerModule.load(decorateModule);
                    decoratingContainerModule.get("IStream");
            
                    expect(onSingletonActivationCount).toBe(1);
                })
                  
                it("should respect transient scope on the root", ()=>{
                    const decoratingContainerModule = createDecoratingModuleContainer();
                    let onTransientActivationCount=0;
                    const bindModule2=new OneShotDecoratingContainerModule((bind)=>{
                        bind("IStream").to(FileStream).inTransientScope().onActivation((c,fs)=>{
                            onTransientActivationCount++;
                        })
                    })
                    const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                        bind("arg").toConstantValue("The Arg")
                        d("IStream", StreamWithArgument);
                    })
                    decoratingContainerModule.load(bindModule2,decorateModule);
                    decoratingContainerModule.get("IStream");
                    decoratingContainerModule.get("IStream");
            
                    expect(onTransientActivationCount).toBe(2);
                })
                describe("decorator scope", ()=>{
                    it("should work with singleton scope",()=>{
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(FileStream).inSingletonScope();
                        })
                        const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                            bind("arg").toConstantValue("The Arg")
                            d("IStream", StreamWithArgument);
                        })
                        decoratingContainerModule.load(bindModule,decorateModule);
                        expect(decoratingContainerModule.get("IStream")).toBe(decoratingContainerModule.get("IStream"));
                    })

                    it("should work with transient scope",()=>{
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(FileStream).inTransientScope();
                        })
                        const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                            bind("arg").toConstantValue("The Arg")
                            d("IStream", StreamWithArgument);
                        })
                        decoratingContainerModule.load(bindModule,decorateModule);
                        expect(decoratingContainerModule.get("IStream")).not.toBe(decoratingContainerModule.get("IStream"));
                    })
                    it("should work with request scope",()=>{
                        const decoratingContainerModule = createDecoratingModuleContainer();
                        const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                            bind("IStream").to(FileStream).inRequestScope();
                            bind(RequestScopeWithStream).toSelf();
                            bind(WithStream).toSelf();
                        })
                        const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                            d("IStream", EncryptedStream);
                        })
                        decoratingContainerModule.load(bindModule,decorateModule);
                        const requestScopeWithStream=decoratingContainerModule.get<RequestScopeWithStream>(RequestScopeWithStream);
                        const requestScopeDecoratorStream=(requestScopeWithStream.stream as EncryptedStream);
                        
                        const requestScopeDecoratorStream2=(requestScopeWithStream.withStream.stream as EncryptedStream);
                        expect(requestScopeDecoratorStream).toBe(requestScopeDecoratorStream2);
                    })
                })
            })
        })
        
        it("Should report decoratorCount", ()=>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                bind("IStream").to(FileStream);
            })
            const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                bind("arg").toConstantValue("The Arg")
                d("IStream", StreamWithArgument);
            })
            decoratingContainerModule.load(bindModule);
            expect(bindModule.decoratedCount("IStream")).toBe(0);
            decoratingContainerModule.load(decorateModule);
            expect(bindModule.decoratedCount("IStream")).toBe(1);
            decoratingContainerModule.unload(decorateModule);
            expect(bindModule.decoratedCount("IStream")).toBe(0);
        })
        
        it("should decorate when load decorator module before decorated module",()=>{
            const decoratingContainerModule = createDecoratingModuleContainer();
            const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                bind(WithStream).toSelf();
                bind("IStream").to(FileStream);
            })
            const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                bind("arg").toConstantValue("The Arg")
                d("IStream", StreamWithArgument);
            })
            decoratingContainerModule.load(decorateModule);
            decoratingContainerModule.load(bindModule);
            expect(decoratingContainerModule.get<WithStream>(WithStream).readStream()).toBe("StreamWithArgument[The Arg](FileStream)")
        })
        describe("re syntaxing",()=>{
            it("should work when to is changed",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let to!:interfaces.BindingToSyntax<any>
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    to=bind("IStream");
                    to.to(FileStream);
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("Encrypted(FileStream)");
                //no good in cached singleton scope ( only toDynamicValue clears the cache....)
                to.to(MemoryStream);
                expect(decoratingContainerModule.get<IStream>("IStream").read()).toEqual("Encrypted(MemoryStream)");
            })
            it("should work when onActivation is changed", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let on!:interfaces.BindingOnSyntax<any>
                let originalOnActivationCalled=false;
                let newOnActivationCalled=false;
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    on=bind("IStream").to(FileStream);
                    on.onActivation((c,i)=>{
                        originalOnActivationCalled=true;
                    });
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                decoratingContainerModule.get("IStream");
                on.onActivation((c,i)=>{
                    newOnActivationCalled=true;
                });
                decoratingContainerModule.get("IStream");
                expect(originalOnActivationCalled).toEqual(true);
                expect(newOnActivationCalled).toEqual(true);
            })
            it("should work when when is changed",()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let when!:interfaces.BindingWhenSyntax<any>
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    when=bind("IStream").to(FileStream);
                    when.whenTargetNamed("File");
                    bind(WithFileStream).toSelf();
                    bind(WithMemoryStream).toSelf();
                })
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                })
                decoratingContainerModule.load(bindModule,decorateModule);
                expect(decoratingContainerModule.get(WithFileStream).readStream()).toEqual("Encrypted(FileStream)");
                when.whenTargetNamed("Memory");
                expect(decoratingContainerModule.get(WithMemoryStream).readStream()).toEqual("Encrypted(FileStream)");
            })
            it("should work when scope is changed", ()=>{
                const decoratingContainerModule = createDecoratingModuleContainer();
                let inSyntax!:interfaces.BindingInSyntax<any>;
                
                const bindModule=new OneShotDecoratingContainerModule((bind)=>{
                    inSyntax=bind("IStream").to(FileStream);
                    inSyntax.inSingletonScope();
                });
                const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,d)=>{
                    d("IStream", EncryptedStream);
                });
                decoratingContainerModule.load(bindModule,decorateModule);
                const singleton1=decoratingContainerModule.get<EncryptedStream>("IStream").baseStream;
                const singleton2=decoratingContainerModule.get<EncryptedStream>("IStream").baseStream;
                expect(singleton1).toBe(singleton2);

                inSyntax.inTransientScope();
                const transient=decoratingContainerModule.get<EncryptedStream>("IStream").baseStream;
                expect(transient).not.toBe(singleton1);
            })
            
        })
    })
    
});