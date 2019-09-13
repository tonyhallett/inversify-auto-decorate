# Why ?

[Inversify issue - Provide support for registering types implementing the decorator pattern](https://github.com/inversify/InversifyJS/issues/575).

## Usage

```typescript
//classes depending on the type ("IStream") that is being decorated
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
//streams to decorate
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
//decorators
@injectable()
class EncryptedStream implements IStream {
    constructor(@inject("IStream") public baseStream: IStream) { }
    read(){
        return `Encrypted(${this.baseStream.read()})`;
    }
}
@injectable()
class CompressedLevelStream implements IStream {
    constructor(
        @inject("IStream") private baseStream: IStream,
        @inject("CompressionLevel") private compressionLevel:"High"|"Medium"|"Low") {  }
    read(){
        return `Compressed_${this.compressionLevel}_(${this.baseStream.read()})`;
    }
}

//create the container - default is last decorator constructed first - changing to 
const decoratingContainerModule =  new DecoratingModuleContainer(false);
//create as many modules as you need
const bindModule=new ContainerModule((bind)=>{
    bind(WithFileStream).toSelf();
    bind(WithMemoryStream).toSelf();
    //bind the root/s of the decorator chain
    //in this demo decorators will be applied to both roots
    bind("IStream").to(FileStream).whenTargetNamed("File");
    bind("IStream").to(MemoryStream).whenTargetNamed("Memory");
})
//To decorate you need a particular type of module.  
//You can create your own implementation of DecoratingContainerModule or derive from 
//DecoratingContainerModuleClass as does 
//OneShotDecoratingContainerModule that works like ContainerModule but has additional
//decorate and decoratedCount function arguments
const decorateModule=new OneShotDecoratingContainerModule((bind, u,i,r,decorate)=>{
    //the decorators can inject arguments other than what they are decorating
    bind("CompressionLevel").toConstantValue("High")
    decorate("IStream",CompressedLevelStream);
})
//create as many decorators as you like
const decorateModule2=new OneShotDecoratingContainerModule((bind, u,i,r,decorate)=>{
    decorate("IStream", EncryptedStream);
})
//load to have the decorators applied
decoratingContainerModule.load(bindModule,decorateModule,decorateModule2);
expect(decoratingContainerModule.get<WithFileStream>(WithFileStream).readStream()).toEqual("Compressed_High_(Encrypted(FileStream))")
expect(decoratingContainerModule.get<WithMemoryStream>(WithMemoryStream).readStream()).toEqual("Compressed_High_(Encrypted(MemoryStream))")

```