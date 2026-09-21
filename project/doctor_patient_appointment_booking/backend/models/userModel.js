const mongoose = require('mongoose');
const DEFAULT_CONSULTATION_SLOTS = ["8-9", "9-10", "4-5", "7-8"];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["doctor", "patient"],default:"patient", required: true },
  location:{ type: String, required: true },
  specialty:String,
  consultationSlots: {
    type: [String],
    default: DEFAULT_CONSULTATION_SLOTS,
  },
});

const Usermodel = mongoose.model('user', userSchema);

module.exports={
  Usermodel,
  DEFAULT_CONSULTATION_SLOTS,
}
