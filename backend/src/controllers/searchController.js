import { searchAccessibleDatasets } from '../services/datasetService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const search = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '');
  const data = await searchAccessibleDatasets(req.user.id, req.user.departmentId, query);
  res.json({ success: true, data });
});
