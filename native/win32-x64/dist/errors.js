"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddonNotLoadedError = exports.AddonLoadError = void 0;
class AddonLoadError extends Error {
    constructor(feature, cause) {
        super(`Failed to load native ${feature} addon`);
        this.name = 'AddonLoadError';
        this.feature = feature;
        this.cause = cause;
    }
}
exports.AddonLoadError = AddonLoadError;
class AddonNotLoadedError extends Error {
    constructor(feature) {
        super(`Native ${feature} addon is not loaded`);
        this.name = 'AddonNotLoadedError';
        this.feature = feature;
    }
}
exports.AddonNotLoadedError = AddonNotLoadedError;
