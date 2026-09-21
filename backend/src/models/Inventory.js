const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'Tools',
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      default: 'units'
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: [0, 'Reorder level cannot be negative']
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock'
    },
    supplier: {
      type: String,
      default: '',
      trim: true
    },
    pricePerUnit: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Calculate stock status before saving
inventorySchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

// Map _id to id for clean JSON serialization
inventorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
