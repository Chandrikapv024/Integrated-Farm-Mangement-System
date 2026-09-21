const Inventory = require('../models/Inventory');

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
    const item = await Inventory.findOne({ _id: req.params.id, user: req.user._id });
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

    if (!name) {
      return res.status(400).json({ success: false, message: 'Inventory item name is required' });
    }

    const q = parseFloat(quantity) || 0;
    const r = parseFloat(reorderLevel) || 5;
    let status = 'In Stock';
    if (q === 0) status = 'Out of Stock';
    else if (q <= r) status = 'Low Stock';

    const newItem = await Inventory.create({
      user: req.user._id,
      name,
      category: category || 'Tools',
      quantity: q,
      unit: unit || 'units',
      reorderLevel: r,
      status,
      supplier: supplier || '',
      pricePerUnit: parseFloat(pricePerUnit) || 0
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
    let item = await Inventory.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const { name, category, quantity, unit, reorderLevel, supplier, pricePerUnit } = req.body;

    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (quantity !== undefined) item.quantity = parseFloat(quantity) || 0;
    if (unit !== undefined) item.unit = unit;
    if (reorderLevel !== undefined) item.reorderLevel = parseFloat(reorderLevel) || 0;
    if (supplier !== undefined) item.supplier = supplier;
    if (pricePerUnit !== undefined) item.pricePerUnit = parseFloat(pricePerUnit) || 0;

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
    const item = await Inventory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
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
