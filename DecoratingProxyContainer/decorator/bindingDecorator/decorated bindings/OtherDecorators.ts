import { interfaces } from "inversify";
import { BindMethods } from "../../BindMethods";
import { deleteInversifyMetadata } from "../../../inversifyCommon/inversifyMetadata";
export class OtherDecorators {
    private boundDecorators: OtherDecorator[] = [];
    bindDecorator(decorator: any, serviceIdentifier: interfaces.ServiceIdentifier<any>, bindMethods: BindMethods) {
        this.boundDecorators.push(new OtherDecorator(decorator, serviceIdentifier, bindMethods));
    }
    remove() {
        this.boundDecorators.forEach(bd => bd.remove());
        this.boundDecorators = [];
    }
}
class OtherDecorator {
    constructor(private decorator: any, private serviceIdentifier: interfaces.ServiceIdentifier<any>, private bindMethods: BindMethods) {
        bindMethods.bind(serviceIdentifier).to(decorator);
    }
    remove() {
        deleteInversifyMetadata(this.decorator);
        this.ensureUnbound();
    }
    private ensureUnbound() {
        //todo - pass down isBound function
        try {
            this.bindMethods.unbind(this.serviceIdentifier);
        }
        catch (e) { }
    }
}