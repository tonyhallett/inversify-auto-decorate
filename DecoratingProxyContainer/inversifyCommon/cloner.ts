import { decorate, injectable, METADATA_KEY, interfaces } from "inversify";


function cloneClass(toClone:Function&{prototype:any}){
    const clone=function(){
        return new (toClone as any)(...arguments);
    }
    clone.prototype = toClone.prototype;
    return clone;
}
export function cloneInjectable(toCloneAndMakeInjectable: any){
    const decoratorClone = cloneClass(toCloneAndMakeInjectable);
    decorate(injectable(),decoratorClone);
    return decoratorClone as any;
}

export function clonePropertyMetadata(original:any,clone:any){
    if(Reflect.hasMetadata(METADATA_KEY.TAGGED_PROP,original)){
        const propertyMetadata = Reflect.getMetadata(METADATA_KEY.TAGGED_PROP,original);
        //should take a copy if bothered about affecting original
        Reflect.defineMetadata(METADATA_KEY.TAGGED_PROP, propertyMetadata, clone);
    }
}
export function cloneConstructorParametersMetadata(original:any,clone:any,cb:(index:number,md:interfaces.Metadata)=>interfaces.Metadata){
    if(Reflect.hasOwnMetadata(METADATA_KEY.TAGGED,original)){
        const clonedConstructorParameterMetadata = {} as interfaces.ReflectResult;
        const constructorParameterMetadata : interfaces.ReflectResult = Reflect.getMetadata(METADATA_KEY.TAGGED,original);
        Object.keys(constructorParameterMetadata).forEach(k=>{
            const metadatas = constructorParameterMetadata[k as string];
            const newMetadatas:interfaces.Metadata[]=[];
            metadatas.forEach(m=>{
                const newMetadata=cb(Number.parseInt(k),m);
                newMetadatas.push({key:newMetadata.key,value:newMetadata.value});
            })
            clonedConstructorParameterMetadata[k]=newMetadatas
        })
        Reflect.defineMetadata(METADATA_KEY.TAGGED, clonedConstructorParameterMetadata, clone);
    }
}
