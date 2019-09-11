import { getAllFuncs } from "../DecoratingProxyContainer/javascriptHelpers";

describe("javascript helpers",()=>{
    describe("getAllFuncs",()=>{
        it("should get all functions",()=>{
            class SomeClass{
                property=1
                someFunction1(){
        
                }
                someFunction2(){
        
                }
            }
            expect(getAllFuncs(new SomeClass())).toEqual(["constructor","someFunction1","someFunction2"])
        })
        
    })
    
})