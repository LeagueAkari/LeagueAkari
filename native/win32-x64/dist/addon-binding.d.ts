import { NativeAddonFeature } from './errors';
export declare class NativeAddonBinding<T> {
    private readonly feature;
    private readonly loader;
    private binding;
    constructor(feature: NativeAddonFeature, loader: () => T);
    load(): void;
    isLoaded(): boolean;
    get(): T;
}
