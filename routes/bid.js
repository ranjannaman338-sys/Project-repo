const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

module.exports = (io) => {
  // Place a bid
  router.post('/', auth, async (req, res) => {
    try {
      const { itemId, bidAmount } = req.body;
      const item = await Item.findById(itemId);
      if (!item) return res.status(404).json({ message: 'Item not found' });

      if (bidAmount <= item.currentBid) {
        return res.status(400).json({ message: 'Bid must be higher than current bid' });
      }

      if (new Date() > new Date(item.endTime)) {
        return res.status(400).json({ message: 'Auction has ended' });
      }

      // Create bid record
      const bid = new Bid({
        userId: req.user.id,
        userName: req.user.name,
        itemId,
        bidAmount
      });
      await bid.save();

      // Update item current bid
      item.currentBid = bidAmount;
      await item.save();

      // Emit socket event
      io.emit('newBid', {
        itemId,
        bidAmount,
        userName: req.user.name,
        timestamp: bid.timestamp
      });

      res.json({ message: 'Bid placed successfully', currentBid: item.currentBid });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get current user's bids
  router.get('/user/my-bids', auth, async (req, res) => {
    try {
      const bids = await Bid.find({ userId: req.user.id })
        .populate('itemId', 'title imageUrl category')
        .sort({ timestamp: -1 });
      res.json(bids);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get bidding history
  router.get('/:itemId', async (req, res) => {
    try {
      const bids = await Bid.find({ itemId: req.params.itemId }).sort({ timestamp: -1 });
      res.json(bids);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
