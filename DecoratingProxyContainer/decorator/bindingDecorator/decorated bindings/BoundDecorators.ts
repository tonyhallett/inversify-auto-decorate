import { interfaces } from "inversify";
import { BindMethods } from "../../BindMethods";
import { IBind } from "./IBind";
import { BoundDecorator } from "./BoundDecorator";
import { IBinder } from "./IBinder";
import { IDecoratorNamer } from "./IDecoratorNamer";
export class BoundDecorators implements IBinder {
    private boundDecorators: BoundDecorator[] = [];
    requiresRebind=false;
    constructor(private lastDecoratorConstructedFirst: boolean, private serviceIdentifier: interfaces.ServiceIdentifier<any>, private rootName: string, private decoratorNamer: IDecoratorNamer) { }
    
    private addDecoratorInOrder(decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods) {
        const boundDecorator = new BoundDecorator(this.serviceIdentifier, decoratorModuleId, decorator, decoratorBindMethods);
        if (this.lastDecoratorConstructedFirst) {
            this.boundDecorators = [boundDecorator].concat(this.boundDecorators);
        }
        else {
            this.boundDecorators.push(boundDecorator);
        }
    }
    decoratedCount() {
        return this.boundDecorators.length;
    }
    public addDecorator(decoratorModuleId: number, decorator: interfaces.Newable<any>, decoratorBindMethods: BindMethods) {
        this.addDecoratorInOrder(decoratorModuleId, decorator, decoratorBindMethods);
    }
    public unload(moduleIds: number[]): {unloadedBinds:IBind[],noDecoratorsRemain:boolean} {
        const numDecoratorsBeforeUnload=this.boundDecorators.length;
        const newBoundDecorators: BoundDecorator[] = [];
        const unloadedBinds: IBind[] = [];
        this.boundDecorators.forEach((bd) => {
            const remove = moduleIds.some(id => id === bd.decoratorModuleId);
            if (remove) {
                unloadedBinds.push(bd);
            }
            else {
                newBoundDecorators.push(bd);
            }
        });
        this.boundDecorators = newBoundDecorators;
        return {
            unloadedBinds,
            noDecoratorsRemain:numDecoratorsBeforeUnload===unloadedBinds.length
        }
    }
    public getBind(): IBind  {
        return this.boundDecorators[0];
    }
    public setDecoratorChain() {
        this.boundDecorators.forEach((bd, i) => {
            if (!bd.isBound||this.requiresRebind) {
                bd.bindDecorator();
            }
            const isLast = i === this.boundDecorators.length - 1;
            bd.setUp(this.decoratorNamer.getDecoratorName(i), isLast ? this.rootName : this.decoratorNamer.getDecoratorName(i + 1));
        });
        this.requiresRebind=false;
    }
}
