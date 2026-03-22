import { getShieldedState, setShieldedState } from "./storage.js";

function normalizeState(state) {
  if (!state || typeof state !== "object") {
    return { notesByAddress: {} };
  }
  return {
    notesByAddress: state.notesByAddress && typeof state.notesByAddress === "object" ? state.notesByAddress : {},
  };
}

export async function listShieldedNotes(address) {
  const state = normalizeState(await getShieldedState());
  return Array.isArray(state.notesByAddress[address]) ? state.notesByAddress[address] : [];
}

export async function appendShieldedNote(address, note) {
  const state = normalizeState(await getShieldedState());
  const current = Array.isArray(state.notesByAddress[address]) ? state.notesByAddress[address] : [];
  state.notesByAddress[address] = [...current, note];
  await setShieldedState(state);
  return state.notesByAddress[address];
}

export async function updateShieldedNote(address, commitment, updater) {
  const state = normalizeState(await getShieldedState());
  const current = Array.isArray(state.notesByAddress[address]) ? state.notesByAddress[address] : [];
  state.notesByAddress[address] = current.map((note) => {
    if (note.commitment !== commitment) {
      return note;
    }
    return updater(note);
  });
  await setShieldedState(state);
  return state.notesByAddress[address];
}

