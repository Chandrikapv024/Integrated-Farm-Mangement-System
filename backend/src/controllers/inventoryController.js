const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

const ALLOWED_CATEGORIES = ['Fertilizers', 'Seeds', 'Pesticides', 'Tools', 'Equipment', 'Other'];

/**
 * Format inventory response to guarantee id field is present
 */
const formatInventoryResponse = (item) => {
  const obj = item.toObject ? item.toObject() : item;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id
  };
};

/**
 * Helper to validate non-negative numbers
 */
const isValidNonNegativeNumber = (val) => {
  if (val === undefined || val === null || val === '') return true; // optional/defaultable
  const num = Number(val);
  return typeof val !== 'boolean' && !isNaN(num) && num >= 0;
};

/**
 * @desc    Get all inventory items for logged-in user
 * @route   GET /api/inventory
 * @access  Private
 */
const getInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(items.map(formatInventoryResponse));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single inventory item by ID
 * @route   GET /api/inventory/:id
 * @access  Private
 */
const getInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID format'
      });
    }

    const item = await Inventory.findOne({ _id: id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.status(200).json(formatInventoryResponse(item));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new inventory item
 * @route   POST /api/inventory
 * @access  Private
 */
const createInventoryItem = async (req, res, next) => {
  try {
    const { name, category, quantity, unit, reorderLevel, supplier, pricePerUnit } = req.body;

    // 1. Name validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Inventory item name is required' });
    }

    // 2. Category validation
    if (category !== undefined && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Supported categories are: ${ALLOWED_CATEGORIES.join(', ')}`
      });
    }

    // 3. Numeric input validation
    if (quantity !== undefined && !isValidNonNegativeNumber(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid non-negative number'
      });
    }

    if (reorderLevel !== undefined && !isValidNonNegativeNumber(reorderLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Reorder level must be a valid non-negative number'
      });
    }

    if (pricePerUnit !== undefined && !isValidNonNegativeNumber(pricePerUnit)) {
      return res.status(400).json({
        success: false,
        message: 'Price per unit must be a valid non-negative number'
      });
    }

    const q = quantity !== undefined ? Number(quantity) : 0;
    const r = reorderLevel !== undefined ? Number(reorderLevel) : 5;
    const p = pricePerUnit !== undefined ? Number(pricePerUnit) : 0;

    const newItem = await Inventory.create({
      user: req.user._id,
      name: name.trim(),
      category: category || 'Tools',
      quantity: q,
      unit: unit ? String(unit).trim() : 'units',
      reorderLevel: r,
      supplier: supplier ? String(supplier).trim() : '',
      pricePerUnit: p
    });

    res.status(201).json(formatInventoryResponse(newItem));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private
 */
const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID format'
      });
    }

    let item = await Inventory.findOne({ _id: id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const { name, category, quantity, unit, reorderLevel, supplier, pricePerUnit } = req.body;

    // Validate inputs if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Inventory item name cannot be empty' });
      }
      item.name = name.trim();
    }

    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${category}'. Supported categories are: ${ALLOWED_CATEGORIES.join(', ')}`
        });
      }
      item.category = category;
    }

    if (quantity !== undefined) {
      if (!isValidNonNegativeNumber(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a valid non-negative number'
        });
      }
      item.quantity = Number(quantity);
    }

    if (reorderLevel !== undefined) {
      if (!isValidNonNegativeNumber(reorderLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Reorder level must be a valid non-negative number'
        });
      }
      item.reorderLevel = Number(reorderLevel);
    }

    if (pricePerUnit !== undefined) {
      if (!isValidNonNegativeNumber(pricePerUnit)) {
        return res.status(400).json({
          success: false,
          message: 'Price per unit must be a valid non-negative number'
        });
      }
      item.pricePerUnit = Number(pricePerUnit);
    }

    if (unit !== undefined) item.unit = String(unit).trim();
    if (supplier !== undefined) item.supplier = String(supplier).trim();

    await item.save(); // Triggers pre('save') hook to re-calculate status

    res.status(200).json(formatInventoryResponse(item));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private
 */
const deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID format'
      });
    }

    const item = await Inventory.findOneAndDelete({ _id: id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.status(200).json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};
