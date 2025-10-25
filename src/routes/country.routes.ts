import { Router } from 'express';
import {
  refreshCountries,
  getCountries,
  getCountryByName,
  deleteCountryByName,
  getStatus,
  getSummaryImage
} from '../controllers/country.controller';

const router = Router();

router.post('/refresh', refreshCountries);
router.get('/', getCountries);
router.get('/image', getSummaryImage);
router.get('/:name', getCountryByName);
router.delete('/:name', deleteCountryByName);
router.get('/status', getStatus);

export default router;
