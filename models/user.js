const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  orderHistory: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  address: [
    {
      name: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pin: { type: String },
      phone: { type: String },
    },
  ],
  OTP: { type: String },
  OTPCreatedTime: { type: Date },
  OTPAttempts: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockUntil: { type: Date },
})

module.exports = mongoose.model('User', UserSchema)
