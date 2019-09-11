export interface IConstrainedCallback {
    constrainedCalled: (rootName: string) => void;
    getFirstDecorator: () => string;
}
