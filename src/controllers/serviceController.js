const Service = require('../models/Service');
const { uploadImagesToCloudinary } = require('../utils/uploadToCloudinary');

// @desc    Create a new service with automatic image upload
// @route   POST /api/services
// @access  Private (Admin only)
const createService = async (req, res) => {
  try {
    const { title, description, whatsappNumber, isPublished } = req.body;

    // Validate required fields
    if (!title || !description || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, whatsappNumber'
      });
    }

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 1 image'
      });
    }

    if (req.files.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 2 images allowed'
      });
    }

    // Automatically upload images to Cloudinary
    const imageUrls = await uploadImagesToCloudinary(req.files);

    const service = await Service.create({
      title,
      description,
      images: imageUrls,
      whatsappNumber,
      isPublished: isPublished === 'true' || isPublished === true || false
    });

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating service'
    });
  }
};

// @desc    Get all published services (Public)
// @route   GET /api/services
// @access  Public
const getPublishedServices = async (req, res) => {
  try {
    const { sort, search, page = 1, limit = 10 } = req.query;
    
    let query = { isPublished: true };
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting
    let sortOption = {};
    if (sort === 'title') {
      sortOption = { title: 1 };
    } else if (sort === '-title') {
      sortOption = { title: -1 };
    } else if (sort === 'createdAt') {
      sortOption = { createdAt: 1 };
    } else if (sort === '-createdAt') {
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    
    const services = await Service.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    const totalServices = await Service.countDocuments(query);
    
    res.json({
      success: true,
      data: services,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalServices / limitNum),
        totalServices,
        limit: limitNum
      },
      message: 'Services retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
};

// @desc    Get all services (including unpublished) - Admin only
// @route   GET /api/services/admin
// @access  Private (Admin only)
const getAllServices = async (req, res) => {
  try {
    const { sort, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting
    let sortOption = {};
    if (sort === 'title') {
      sortOption = { title: 1 };
    } else if (sort === '-title') {
      sortOption = { title: -1 };
    } else if (sort === 'createdAt') {
      sortOption = { createdAt: 1 };
    } else if (sort === '-createdAt') {
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    
    const services = await Service.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    const totalServices = await Service.countDocuments(query);
    
    res.json({
      success: true,
      data: services,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalServices / limitNum),
        totalServices,
        limit: limitNum
      },
      message: 'All services retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
};

// @desc    Get single service by ID (only if published)
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({ 
      _id: req.params.id, 
      isPublished: true 
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not published'
      });
    }
    
    res.json({
      success: true,
      data: service,
      message: 'Service retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service'
    });
  }
};

// @desc    Update service with optional new images
// @route   PUT /api/services/:id
// @access  Private (Admin only)
const updateService = async (req, res) => {
  try {
    const { title, description, whatsappNumber, isPublished, existingImages } = req.body;
    
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Handle images
    let finalImages = service.images;
    
    // If new images are uploaded, upload them to Cloudinary
    if (req.files && req.files.length > 0) {
      if (req.files.length > 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 2 images allowed'
        });
      }
      
      const newImageUrls = await uploadImagesToCloudinary(req.files);
      
      // Combine existing and new images (max 2)
      let existing = [];
      if (existingImages) {
        existing = typeof existingImages === 'string' ? [existingImages] : existingImages;
      } else {
        existing = service.images;
      }
      
      finalImages = [...newImageUrls, ...existing].slice(0, 2);
    } else if (existingImages) {
      finalImages = typeof existingImages === 'string' ? [existingImages] : existingImages;
    }
    
    // Update fields
    service.title = title || service.title;
    service.description = description || service.description;
    service.images = finalImages;
    service.whatsappNumber = whatsappNumber || service.whatsappNumber;
    service.isPublished = isPublished !== undefined ? isPublished : service.isPublished;
    
    const updatedService = await service.save();
    
    res.json({
      success: true,
      data: updatedService,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating service'
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    await service.deleteOne();
    
    res.json({
      success: true,
      data: {},
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service'
    });
  }
};

module.exports = {
  createService,
  getPublishedServices,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
};