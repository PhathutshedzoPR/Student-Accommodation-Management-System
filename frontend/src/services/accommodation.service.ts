import { api } from './api';
import type { Building, Room, Bed } from '@/types';

export function listBuildings() {
  return api.get<Building[]>('/admin/buildings').then((r) => r.data);
}

// Lightweight, any-authenticated-role version used by the resident
// application form's "building preference" dropdown.
export function listBuildingOptions() {
  return api.get<{ id: string; name: string; address: string }[]>('/buildings').then((r) => r.data);
}

export function createBuilding(data: { name: string; address: string }) {
  return api.post<Building>('/admin/buildings', data).then((r) => r.data);
}

export function createRoom(buildingId: string, data: { roomNumber: string; floor: number; capacity: number }) {
  return api.post<Room>(`/admin/buildings/${buildingId}/rooms`, data).then((r) => r.data);
}

export function listRooms(buildingId?: string) {
  return api.get<Room[]>('/admin/rooms', { params: buildingId ? { buildingId } : {} }).then((r) => r.data);
}

export function getRoomBeds(roomId: string) {
  return api.get<Bed[]>(`/admin/rooms/${roomId}/beds`).then((r) => r.data);
}

export function assignBed(bedId: string, residentId: string) {
  return api.put<Bed>(`/admin/beds/${bedId}/assign`, { residentId }).then((r) => r.data);
}

export function vacateBed(bedId: string) {
  return api.put(`/admin/beds/${bedId}/vacate`).then((r) => r.data);
}
