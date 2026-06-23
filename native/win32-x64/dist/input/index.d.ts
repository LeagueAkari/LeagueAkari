import { EventEmitter } from 'node:events';
import type { NativeKeyState } from '../bindings';
import { KeyDefinition } from './definitions';
export interface KeyEvent extends KeyDefinition {
    keyCode: number;
    isModifier: boolean;
    isCommonModifier: boolean;
    isDown: boolean;
}
export type KeyState = NativeKeyState;
export declare class AkariNativeInput extends EventEmitter<{
    keyEvent: [definition: KeyEvent];
}> {
    private static instance;
    private installed;
    private constructor();
    static getInstance(): AkariNativeInput;
    get isInstalled(): boolean;
    install(): void;
    private _handleNativeKeyEvent;
    uninstall(): void;
    getKeyStates(): KeyState[];
    sendKey(key: number, press: boolean): Promise<void>;
    sendString(str: string): Promise<void>;
}
export declare const instance: AkariNativeInput;
export * from './definitions';
