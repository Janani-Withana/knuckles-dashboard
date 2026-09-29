import { useState } from "react";
import type { Reservation } from "../types/reservation";

const STORAGE_KEY = "reservations";

const readStored = (): Reservation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Reservation[]) : [];
  } catch {
    return [];
  }
};

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>(readStored);

  const commit = (next: Reservation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setReservations(next);
  };

  const addReservation = (data: Omit<Reservation, "id">) =>
    commit([{ ...data, id: crypto.randomUUID() }, ...readStored()]);

  const removeReservation = (id: string) =>
    commit(readStored().filter((r) => r.id !== id));

  return { reservations, addReservation, removeReservation };
}