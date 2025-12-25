export interface PlayerLootMap {
  [key: string]: Loot
}

export interface Loot {
  asset: string
  count: number
  disenchantLootName: string
  disenchantRecipeName: string
  disenchantValue: number
  displayCategories: string
  expiryTime: number
  isNew: boolean
  isRental: boolean
  itemDesc: string
  itemStatus: string
  localizedDescription: string
  localizedName: string
  localizedRecipeSubtitle: string
  localizedRecipeTitle: string
  lootId: string
  lootName: string
  parentItemStatus: string
  parentStoreItemId: number
  rarity: string
  redeemableStatus: string
  refId: string
  rentalGames: number
  rentalSeconds: number
  shadowPath: string
  splashPath: string
  storeItemId: number
  tags: string
  tilePath: string
  type: string
  upgradeEssenceName: string
  upgradeEssenceValue: number
  upgradeLootName: string
  value: number
}

export interface LootContextMenu {
  actionType: string
  enabled: boolean
  essenceQuantity: number
  essenceType: string
  name: string
  recipeContextMenuAction: string
  recipeDescription: string
  requiredOthers: string
  requiredOthersCount: number
  requiredOthersName: string
  requiredTokens: string
}

export interface LootRecipe {
  contextMenuText: string
  crafterName: string
  description: string
  displayCategories: string
  hasVisibleLootOdds: boolean
  imagePath: string
  introVideoPath: string
  loopVideoPath: string
  lootMilestoneIds: any[]
  metadata: Metadata
  outputs: Output[]
  outroVideoPath: string
  recipeName: string
  requirementText: string
  singleOpen: boolean
  slots: Slot[]
  type: string
}

interface Slot {
  lootIds: string[]
  quantity: number
  slotNumber: number
  tags: string
}

interface Output {
  lootName: string
  quantity: number
}

interface Metadata {
  bonusDescriptions: any[]
  guaranteedDescriptions: any[]
  tooltipsDisabled: boolean
}

export interface LootCraftResponse {
  added: Added[]
  redeemed: Redeemed[]
  removed: Added[]
}

interface Redeemed {
  deltaCount: number
  playerLoot: PlayerLoot
}

export interface Added {
  deltaCount: number
  playerLoot: PlayerLoot
}

export interface PlayerLoot {
  asset: string
  count: number
  disenchantLootName: string
  disenchantRecipeName: string
  disenchantValue: number
  displayCategories: string
  expiryTime: number
  isNew: boolean
  isRental: boolean
  itemDesc: string
  itemStatus: string
  localizedDescription: string
  localizedName: string
  localizedRecipeSubtitle: string
  localizedRecipeTitle: string
  lootId: string
  lootName: string
  parentItemStatus: string
  parentStoreItemId: number
  rarity: string
  redeemableStatus: string
  refId: string
  rentalGames: number
  rentalSeconds: number
  shadowPath: string
  splashPath: string
  storeItemId: number
  tags: string
  tilePath: string
  type: string
  upgradeEssenceName: string
  upgradeEssenceValue: number
  upgradeLootName: string
  value: number
}
