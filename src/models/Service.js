const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a service title'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  images: {
    type: [String],
    required: [true, 'Please upload at least 1 image'],
    validate: {
      validator: function(images) {
        return images.length >= 1 && images.length <= 2;
      },
      message: 'You must upload between 1 and 2 images'
    }
  },
  whatsappNumber: {
    type: String,
    required: [true, 'Please add a WhatsApp number'],
    match: [/^[0-9]{10,15}$/, 'Please add a valid phone number (10-15 digits)']
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
serviceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);