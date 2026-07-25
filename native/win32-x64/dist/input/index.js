"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instance = exports.AkariNativeInput = void 0;
exports.load = load;
exports.isLoaded = isLoaded;
const node_events_1 = require("node:events");
const addon_binding_1 = require("../addon-binding");
const definitions_1 = require("./definitions");
const addon = new addon_binding_1.NativeAddonBinding('input', () => require('../../addons/akari-input-win64.node'));
function load() {
    addon.load();
}
function isLoaded() {
    return addon.isLoaded();
}
class AkariNativeInput extends node_events_1.EventEmitter {
    constructor() {
        super();
        this.installed = false;
    }
    static getInstance() {
        if (!AkariNativeInput.instance) {
            AkariNativeInput.instance = new AkariNativeInput();
        }
        return AkariNativeInput.instance;
    }
    get isInstalled() {
        return this.installed;
    }
    install() {
        const binding = addon.get();
        if (this.installed) {
            console.warn('Input hook is already installed');
            return;
        }
        try {
            binding.install();
            binding.onKeyEvent(this._handleNativeKeyEvent.bind(this));
            this.installed = true;
        }
        catch (error) {
            binding.uninstall();
            throw error;
        }
    }
    _handleNativeKeyEvent(rawData) {
        const [keyCodeRaw, state] = rawData.split(',');
        const keyCode = Number.parseInt(keyCodeRaw, 10);
        const definition = definitions_1.VKEY_MAP[keyCode];
        if (!definition) {
            return;
        }
        const isDown = state === 'DOWN';
        const isModifier = (0, definitions_1.isModifierKey)(keyCode);
        const isCommonModifier = (0, definitions_1.isCommonModifierKey)(keyCode);
        this.emit('keyEvent', Object.assign(Object.assign({}, definition), { keyCode,
            isModifier,
            isCommonModifier,
            isDown }));
    }
    uninstall() {
        const binding = addon.get();
        if (!this.installed) {
            console.warn('Input hook is not installed');
            return;
        }
        binding.uninstall();
        this.installed = false;
    }
    getKeyStates() {
        return addon.get().getKeyStates();
    }
    sendKey(key, press) {
        const binding = addon.get();
        if (!Number.isInteger(key) || key < 0 || key > 255) {
            return Promise.reject(new RangeError('Virtual key code must be an integer between 0 and 255'));
        }
        return binding.sendKey(key, press);
    }
    sendString(str) {
        return addon.get().sendString(str);
    }
}
exports.AkariNativeInput = AkariNativeInput;
exports.instance = AkariNativeInput.getInstance();
__exportStar(require("./definitions"), exports);
