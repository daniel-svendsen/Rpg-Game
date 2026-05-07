import type { CharacterRecord } from "../shared/types/saveTypes";
import { jsonRequest } from "./http";

export interface CharacterPayload {
  name: string;
  baseStats: CharacterRecord["baseStats"];
}

export const loadCharacter = async (token: string): Promise<CharacterRecord | null> => {
  try {
    return await jsonRequest<CharacterRecord>("/api/characters/me", { method: "GET" }, token);
  } catch {
    return null;
  }
};

export const loadCharacterWithAuthState = async (
  token: string
): Promise<{ character: CharacterRecord | null; isUnauthorized: boolean }> => {
  try {
    const character = await jsonRequest<CharacterRecord>("/api/characters/me", { method: "GET" }, token);
    return { character, isUnauthorized: false };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    const isUnauthorized = status === 401 || status === 403;
    return { character: null, isUnauthorized };
  }
};

export const createCharacter = async (
  payload: CharacterPayload,
  token: string
): Promise<CharacterRecord> =>
  jsonRequest<CharacterRecord>(
    "/api/characters",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );

export const saveCharacter = async (
  character: CharacterRecord,
  token: string
): Promise<CharacterRecord> =>
  jsonRequest<CharacterRecord>(
    `/api/characters/${character.id}/progress`,
    {
      method: "PUT",
      body: JSON.stringify(character)
    },
    token
  );
