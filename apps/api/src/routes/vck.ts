/**
 * VCK Routes
 *
 * Express routes for VCK operations that require non-tRPC handling,
 * such as binary file downloads.
 */

import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { generateVCKZip } from '../services/vck.js';

const router: RouterType = Router();

/**
 * GET /:projectId/download
 *
 * Download a VCK as a ZIP file.
 * Requires authentication via session cookie.
 */
router.get('/:projectId/download', requireAuth, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Validate projectId is a single string (not array)
    if (typeof projectId !== 'string') {
      throw new HttpError(400, 'Invalid project ID');
    }

    // userId is guaranteed by requireAuth middleware
    const userId = req.userId;
    if (!userId) {
      throw new HttpError(401, 'Authentication required');
    }

    const archive = await generateVCKZip(prisma, projectId, userId);

    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectId}.vck.zip"`);

    // Pipe archive to response
    archive.pipe(res);

    // Handle archive errors
    archive.on('error', (err) => next(err));
  } catch (error) {
    next(error);
  }
});

export default router;
