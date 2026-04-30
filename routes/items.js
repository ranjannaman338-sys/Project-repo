const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// Get all items with filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortByBid, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.currentBid = {};
      if (minPrice) query.currentBid.$gte = Number(minPrice);
      if (maxPrice) query.currentBid.$lte = Number(maxPrice);
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sort = {};
    if (sortByBid === 'asc') sort.currentBid = 1;
    if (sortByBid === 'desc') sort.currentBid = -1;

    const items = await Item.find(query).sort(sort);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create item (Admin/Seller)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, startingPrice, endTime, imageUrl } = req.body;
    const newItem = new Item({
      title,
      description,
      category,
      startingPrice,
      currentBid: startingPrice,
      endTime,
      imageUrl,
      sellerId: req.user.id
    });
    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
