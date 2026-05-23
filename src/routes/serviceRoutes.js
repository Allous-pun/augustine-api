const express = require('express');
const {
  createService,
  getPublishedServices,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getPublishedServices);
router.get('/:id', getServiceById);

// Admin only routes (protected) - now with image upload support
router.get('/admin/all', protect, getAllServices);
router.post('/', protect, uploadImages, createService);
router.put('/:id', protect, uploadImages, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;