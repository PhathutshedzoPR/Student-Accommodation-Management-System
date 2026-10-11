import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BedDouble, Building2 } from 'lucide-react';
import {
  listBuildings,
  createBuilding,
  createRoom,
  assignBed,
  vacateBed,
} from '@/services/accommodation.service';
import { listResidents } from '@/services/residents.service';
import { apiErrorMessage } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { TextField } from '@/components/Field';
import clsx from 'clsx';
import type { Room } from '@/types';

export default function Rooms() {
  const queryClient = useQueryClient();
  const { data: buildings, isLoading } = useQuery({ queryKey: ['admin', 'buildings'], queryFn: listBuildings });

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [roomModalBuildingId, setRoomModalBuildingId] = useState<string | null>(null);
  const [bedModalRoom, setBedModalRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [buildingForm, setBuildingForm] = useState({ name: '', address: '' });
  const [roomForm, setRoomForm] = useState({ roomNumber: '', floor: '1', capacity: '2' });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'buildings'] });
  }

  const buildingMutation = useMutation({
    mutationFn: () => createBuilding(buildingForm),
    onSuccess: () => {
      invalidate();
      setBuildingModalOpen(false);
      setBuildingForm({ name: '', address: '' });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const roomMutation = useMutation({
    mutationFn: () =>
      createRoom(roomModalBuildingId as string, { roomNumber: roomForm.roomNumber, floor: Number(roomForm.floor), capacity: Number(roomForm.capacity) }),
    onSuccess: () => {
      invalidate();
      setRoomModalBuildingId(null);
      setRoomForm({ roomNumber: '', floor: '1', capacity: '2' });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle="Buildings, rooms and bed occupancy."
        actions={
          <button className="btn-primary" onClick={() => setBuildingModalOpen(true)}>
            <Plus size={16} /> Add building
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !buildings?.length ? (
        <div className="card p-8 text-center text-sm text-gray-400">No buildings yet — add one to get started.</div>
      ) : (
        <div className="space-y-6">
          {buildings.map((building) => (
            <div key={building.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-400" />
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{building.name}</h2>
                    <p className="text-xs text-gray-400">{building.address}</p>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => setRoomModalBuildingId(building.id)}>
                  <Plus size={15} /> Add room
                </button>
              </div>

              {!building.rooms?.length ? (
                <p className="mt-4 text-sm text-gray-400">No rooms in this building yet.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {building.rooms.map((room) => {
                    const occupied = room.beds.filter((b) => b.resident).length;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setBedModalRoom(room)}
                        className="rounded-lg border border-gray-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Room {room.roomNumber}</span>
                          <BedDouble size={15} className="text-gray-400" />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Floor {room.floor}</p>
                        <p
                          className={clsx(
                            'mt-1 text-xs font-medium',
                            occupied === room.beds.length ? 'text-green-600' : 'text-gray-500'
                          )}
                        >
                          {occupied}/{room.beds.length} occupied
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={buildingModalOpen}
        onClose={() => setBuildingModalOpen(false)}
        title="Add a building"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setBuildingModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={buildingMutation.isPending || !buildingForm.name} onClick={() => buildingMutation.mutate()}>
              {buildingMutation.isPending ? 'Adding…' : 'Add building'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Name" placeholder="e.g. Block C" value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} />
          <TextField label="Address" value={buildingForm.address} onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={!!roomModalBuildingId}
        onClose={() => setRoomModalBuildingId(null)}
        title="Add a room"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRoomModalBuildingId(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={roomMutation.isPending || !roomForm.roomNumber} onClick={() => roomMutation.mutate()}>
              {roomMutation.isPending ? 'Adding…' : 'Add room'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Room number" placeholder="e.g. 205" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} />
          <TextField label="Floor" type="number" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} />
          <TextField label="Capacity (beds)" type="number" min="1" max="4" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
        </div>
      </Modal>

      <BedModal room={bedModalRoom} onClose={() => setBedModalRoom(null)} onChanged={invalidate} />
    </div>
  );
}

function BedModal({ room, onClose, onChanged }: { room: Room | null; onClose: () => void; onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [assigningBedId, setAssigningBedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: residents } = useQuery({
    queryKey: ['admin', 'residents', 'search', search],
    queryFn: () => listResidents({ q: search || undefined, unassigned: true }),
    enabled: !!assigningBedId,
  });

  const assignMutation = useMutation({
    mutationFn: (residentId: string) => assignBed(assigningBedId as string, residentId),
    onSuccess: () => {
      onChanged();
      setAssigningBedId(null);
      setSearch('');
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const vacateMutation = useMutation({
    mutationFn: (bedId: string) => vacateBed(bedId),
    onSuccess: () => onChanged(),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (!room) return null;

  return (
    <Modal open={!!room} onClose={onClose} title={`Room ${room.roomNumber} — beds`}>
      <div className="space-y-3">
        {error && <Alert tone="error">{error}</Alert>}
        {room.beds.map((bed) => (
          <div key={bed.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Bed {bed.label}</p>
              <p className="text-xs text-gray-500">{bed.resident ? `${bed.resident.firstName} ${bed.resident.lastName} — ${bed.resident.studentNumber}` : 'Vacant'}</p>
            </div>
            {bed.resident ? (
              <button className="btn-secondary text-xs" disabled={vacateMutation.isPending} onClick={() => vacateMutation.mutate(bed.id)}>
                Vacate
              </button>
            ) : assigningBedId === bed.id ? (
              <div className="w-56">
                <input autoFocus className="input mb-1 text-xs" placeholder="Search name or student #…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="max-h-32 overflow-y-auto rounded-md border border-gray-200">
                  {residents?.length ? (
                    residents.map((r) => (
                      <button
                        key={r.id}
                        className="block w-full px-2 py-1.5 text-left text-xs hover:bg-gray-50"
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate(r.id)}
                      >
                        {r.firstName} {r.lastName} — {r.studentNumber}
                      </button>
                    ))
                  ) : (
                    <p className="px-2 py-1.5 text-xs text-gray-400">No unassigned residents match.</p>
                  )}
                </div>
              </div>
            ) : (
              <button className="btn-primary text-xs" onClick={() => setAssigningBedId(bed.id)}>
                Assign
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
