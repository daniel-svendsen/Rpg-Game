import type { CharacterRecord, CharacterSummary } from "../shared/types/saveTypes";
import { jsonRequest } from "./http";

export interface CharacterPayload {
  name: string;
  baseStats: CharacterRecord["baseStats"];
}

export const listCharacters = async (token: string): Promise<CharacterSummary[]> =>
  jsonRequest<CharacterSummary[]>("/api/characters", { method: "GET" }, token);

export const loadCharacterById = async (id: number, token: string): Promise<CharacterRecord> =>
  jsonRequest<CharacterRecord>(`/api/characters/${id}`, { method: "GET" }, token);

export const deleteCharacter = async (id: number, token: string): Promise<void> => {
  await jsonRequest<void>(`/api/characters/${id}`, { method: "DELETE" }, token);
};

export const loadCharactersWithAuthState = async (
  token: string
): Promise<{ characters: CharacterSummary[] | null; isUnauthorized: boolean }> => {
  try {
    const characters = await listCharacters(token);
    return { characters, isUnauthorized: false };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    const isUnauthorized = status === 401 || status === 403;
    return { characters: null, isUnauthorized };
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
