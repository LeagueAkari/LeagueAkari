export interface KeyDefinition {
    _nameRaw: string;
    name: string;
    standardName: string;
    keyId: string;
}
export type VirtualKeyCode = number;
export type KeyDefinitionMap = Partial<Record<VirtualKeyCode, KeyDefinition>>;
export type UnifiedKeyIdMap = Partial<Record<VirtualKeyCode, string>>;
export declare const VKEY_MAP: KeyDefinitionMap;
export declare const MODIFIER_KEYS: Set<number>;
export declare const UNIFIED_KEY_ID: UnifiedKeyIdMap;
export declare function isModifierKey(keyCode: VirtualKeyCode): boolean;
export declare function isCommonModifierKey(keyCode: VirtualKeyCode): boolean;
