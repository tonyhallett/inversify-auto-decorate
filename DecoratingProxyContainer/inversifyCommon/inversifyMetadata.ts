import { METADATA_KEY } from "inversify";

export function deleteInversifyMetadata(someClass:any){
    Reflect.deleteMetadata(METADATA_KEY.TAGGED,someClass);
    Reflect.deleteMetadata(METADATA_KEY.TAGGED_PROP,someClass);
    Reflect.deleteMetadata(METADATA_KEY.PARAM_TYPES,someClass)
}