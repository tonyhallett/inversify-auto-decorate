import { METADATA_KEY, interfaces, decorate, named } from "inversify";

/*returns Object 
export interface ReflectResult {
    [key: string]: Metadata[];
}
*/
export function getReflectInversifyParameterMetadata(newable:interfaces.Newable<any>){
    return Reflect.getMetadata(METADATA_KEY.TAGGED, newable);
}
function iterateReflectParameterMetadata(newable:interfaces.Newable<any>,callback:(reflectResult:any,key:string)=>boolean){
    const reflectResult = getReflectInversifyParameterMetadata(newable);
    const reflectKeys = Object.keys(reflectResult);
    for (let i = 0; i < reflectKeys.length; i++) {
        const shouldBreak=callback(reflectResult,reflectKeys[i]);
        if(shouldBreak) break;
    }
}
function iterateReflectMetadataParameters(newable:interfaces.Newable<any>,callback:(reflectResult:any,key:string,parameterIndex:number)=>boolean){
    iterateReflectParameterMetadata(newable,(reflectResult,key)=>{
        const paramIndexOrProperty = Number.parseInt(key);
        //if path always taken as is parameter metadata !
        if (!isNaN(paramIndexOrProperty)) {
            return callback(reflectResult,key,paramIndexOrProperty)//return is shouldBreak
        }
        return false;
    })
}
export function iterateReflectMetadataParameterMetadatas(newable:interfaces.Newable<any>,callback:(metadatas:interfaces.Metadata[],parameterIndex:number)=>boolean){
    iterateReflectMetadataParameters(newable,(reflectResult,key,parameterIndex)=>{
        const metadatas = reflectResult[key] as interfaces.Metadata[];
        return callback(metadatas,parameterIndex);
    })
}
function getInjectMatchingMetadata(
    metadatas:interfaces.Metadata[],
    serviceIdentifier:interfaces.ServiceIdentifier<any>,
    metadataMatcher:(metadata:interfaces.Metadata)=>boolean){
        let parameterIsMatchingInject=false;
        let matchedMetadata:interfaces.Metadata|undefined;
        for (let j = 0; j < metadatas.length; j++) {
            const metadata = metadatas[j];
            if (metadata.key === METADATA_KEY.INJECT_TAG && metadata.value === serviceIdentifier) {
                parameterIsMatchingInject=true;
            }
            if (metadataMatcher(metadata)) {
                matchedMetadata=metadata;
            }
        }
        return {
            parameterIsMatchingInject,
            matchedMetadata
        }
}
function setNamedMetadata(namedMetadata:interfaces.Metadata|undefined,namedValue:string,newable:interfaces.Newable<any>,parameterIndex:number){
    if (namedMetadata) {
        namedMetadata.value = namedValue;
    }
    else {
        decorate(named(namedValue) as ParameterDecorator, newable, parameterIndex);
    }
}
export function setNamed(namedValue: string,newable:interfaces.Newable<any>,serviceIdentifier:interfaces.ServiceIdentifier<any>) {
    iterateReflectMetadataParameterMetadatas(newable,(metadatas,parameterIndex)=>{
        let shouldBreak=false;
        const { parameterIsMatchingInject,matchedMetadata:namedMetadata}=getInjectMatchingMetadata(metadatas,serviceIdentifier,(metadata=>{
            return metadata.key === METADATA_KEY.NAMED_TAG;
        }))

        if (parameterIsMatchingInject) {
            setNamedMetadata(namedMetadata,namedValue,newable,parameterIndex);
            shouldBreak=true;
        }
        return shouldBreak;
    })
}
