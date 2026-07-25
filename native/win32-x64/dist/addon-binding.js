"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeAddonBinding = void 0;
const errors_1 = require("./errors");
class NativeAddonBinding {
    constructor(feature, loader) {
        this.feature = feature;
        this.loader = loader;
    }
    load() {
        if (this.binding !== undefined) {
            return;
        }
        try {
            const binding = this.loader();
            if (binding === undefined || binding === null) {
                throw new TypeError(`Native ${this.feature} addon returned no exports`);
            }
            this.binding = binding;
        }
        catch (cause) {
            throw new errors_1.AddonLoadError(this.feature, cause);
        }
    }
    isLoaded() {
        return this.binding !== undefined;
    }
    get() {
        if (this.binding === undefined) {
            throw new errors_1.AddonNotLoadedError(this.feature);
        }
        return this.binding;
    }
}
exports.NativeAddonBinding = NativeAddonBinding;
