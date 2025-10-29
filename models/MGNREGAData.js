const mongoose = require('mongoose');

const mgnregaSchema = new mongoose.Schema({
  state_name: String,
  district_name: String,
  fin_year: String,
  fin_month: String,
  total_persondays_generated_so_far_lakh: {
    type: Number,
    set: (v) => parseFloat(v) || 0  // Critical: convert string to number
  },
  total_no_of_hhs_worked_lakh: {
    type: Number,
    set: (v) => parseFloat(v) || 0
  },
  total_exp_rs_cr: {
    type: Number,
    set: (v) => parseFloat(v) || 0
  },
  fetchedAt: { type: Date, default: Date.now },
  raw_data: mongoose.Schema.Types.Mixed
}, { timestamps: true });

mgnregaSchema.index({ state_name: 1, district_name: 1, fin_year: 1 });
mgnregaSchema.index({ fetchedAt: 1 });

module.exports = mongoose.model('MGNREGAData', mgnregaSchema);