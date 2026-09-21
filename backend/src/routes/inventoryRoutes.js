const express = require('express');
const {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInventory)
  .post(createInventoryItem);

router.route('/:id')
  .get(getInventoryById)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

module.exports = router;
