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

