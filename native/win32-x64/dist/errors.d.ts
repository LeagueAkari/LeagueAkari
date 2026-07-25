export type NativeAddonFeature = 'input' | 'tools';
export declare class AddonLoadError extends Error {
    readonly feature: NativeAddonFeature;
    readonly cause: unknown;
    constructor(feature: NativeAddonFeature, cause: unknown);
}
export declare class AddonNotLoadedError extends Error {
    readonly feature: NativeAddonFeature;
    constructor(feature: NativeAddonFeature);
}
