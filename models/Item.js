const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startingPrice: { type: Number, required: true },
  currentBid: { type: Number, required: true },
  endTime: { type: Date, required: true },
  imageUrl: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
