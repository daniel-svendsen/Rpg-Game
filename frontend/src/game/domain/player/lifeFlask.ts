import { balanceConfig } from "../../config/balanceConfig";
import type { CharacterRecord } from "../../../shared/types/saveTypes";

export const createInitialLifeFlask = () => ({
  currentCharges: balanceConfig.healing.lifeFlask.maxCharges
});

export const normalizeLifeFlask = (currentCharges: number | undefined) => ({
  currentCharges: Math.max(
    0,
    Math.min(balanceConfig.healing.lifeFlask.maxCharges, Math.floor(currentCharges ?? balanceConfig.healing.lifeFlask.maxCharges))
  )
});

export const gainLifeFlaskCharges = (character: CharacterRecord, gainedCharges: number): CharacterRecord => ({
  ...character,
  lifeFlask: {
    currentCharges: Math.min(
      balanceConfig.healing.lifeFlask.maxCharges,
      character.lifeFlask.currentCharges + gainedCharges
    )
  }
});

export const canUseLifeFlask = (character: CharacterRecord): boolean =>
  character.currentHealth > 0 &&
  character.currentHealth < character.derivedStats.maxHealth &&
  character.lifeFlask.currentCharges >= balanceConfig.healing.lifeFlask.chargesPerUse;

export const useLifeFlask = (character: CharacterRecord): CharacterRecord => {
  if (!canUseLifeFlask(character)) {
    return character;
  }

  const healAmount = Math.max(
    1,
    Math.round(character.derivedStats.maxHealth * balanceConfig.healing.lifeFlask.healPercentPerUse)
  );

  return {
    ...character,
    currentHealth: Math.min(character.derivedStats.maxHealth, character.currentHealth + healAmount),
    lifeFlask: {
      currentCharges: character.lifeFlask.currentCharges - balanceConfig.healing.lifeFlask.chargesPerUse
    }
  };
};
