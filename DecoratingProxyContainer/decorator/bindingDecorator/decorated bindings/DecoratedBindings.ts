import { IFluentCall } from "../../proxy binding/IFluentCall";
import { IProxyBinding } from "../../proxy binding/ProxyBinding";
import { IBind } from "./IBind";
import { IConstrainedCallback } from "./IConstrainedCallback";
import { IBinder } from "./IBinder";
import { DecoratedBinding } from "./DecoratedBinding";

export class DecoratedBindings implements IBinder{
    
    private rootSuffix=0;
    private decoratedBindingsLookup = new Map<number,DecoratedBinding>();
    constructor(private serviceIdentifier:string,private constrainedCallback:IConstrainedCallback){}
    fluentCalled(bindingId: number, call: IFluentCall<any>) {
        this.decoratedBindingsLookup.get(bindingId)!.fluentCalled(call);
    }
    
    
    getBind(): IBind  {
        const decoratedBindings=this.decoratedBindingsLookup.values();
        return decoratedBindings.next().value
    }
    
    public create(binding:IProxyBinding){
        const rootName=`${this.serviceIdentifier}_Root${this.rootSuffix++}`;
        this.decoratedBindingsLookup.set(binding.bindingId,new DecoratedBinding(binding,rootName,this.constrainedCallback))
    }
    count(){
        return this.decoratedBindingsLookup.size;
    }
    public unload(moduleIds: number[]):{unloadedBinds:IBind[],noBindingsRemain:boolean}{
        const numDecoratedBindingsBeforeUnload=this.decoratedBindingsLookup.size;
        const unloadedBinds:IBind[]=[];
        const newDecoratedBindingsLookup=new Map<number, DecoratedBinding>();
        this.decoratedBindingsLookup.forEach((db,key)=>{
            const remove=moduleIds.some(id=>id===db.moduleId);
            if(remove){
                unloadedBinds.push(db);
            }else{
                newDecoratedBindingsLookup.set(key,db);
            }
        })
        this.decoratedBindingsLookup=newDecoratedBindingsLookup;
        return {
            unloadedBinds,
            noBindingsRemain:numDecoratedBindingsBeforeUnload===unloadedBinds.length
        }    
    }
    unbind() {
        this.decoratedBindingsLookup.clear();
    }
}


