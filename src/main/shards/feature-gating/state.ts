import {
  type FeatureGateDevOverrides,
  FeatureGateDevOverridesSchema
} from '@shared/shards/feature-gating'
import { makeAutoObservable, observableRef } from 'mobx'

export const featureGateDevOverridesSchema = FeatureGateDevOverridesSchema

export class FeatureGatingSettings {
  devOverrides: FeatureGateDevOverrides = {}

  setDevOverrides(value: FeatureGateDevOverrides) {
    this.devOverrides = value
  }

  constructor() {
    makeAutoObservable(this, {
      devOverrides: observableRef
    })
  }
}
