import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import {
  listBuildings,
  listPublicBuildings,
  createBuilding,
  createRoom,
  listRooms,
  getRoomBeds,
  assignBed,
  vacateBed,
} from '../controllers/accommodation.controller';

const router = Router();

router.get('/buildings', authenticate, listPublicBuildings);

router.get('/admin/buildings', authenticate, requireRole('ADMIN'), listBuildings);
router.post('/admin/buildings', authenticate, requireRole('ADMIN'), createBuilding);
router.post('/admin/buildings/:id/rooms', authenticate, requireRole('ADMIN'), createRoom);
router.get('/admin/rooms', authenticate, requireRole('ADMIN'), listRooms);
router.get('/admin/rooms/:id/beds', authenticate, requireRole('ADMIN'), getRoomBeds);
router.put('/admin/beds/:id/assign', authenticate, requireRole('ADMIN'), assignBed);
router.put('/admin/beds/:id/vacate', authenticate, requireRole('ADMIN'), vacateBed);

export default router;
