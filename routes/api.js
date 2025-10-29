// routes/api.js
const express = require('express');
const fetch = require('node-fetch');
const MGNREGAData = require('../models/MGNREGAData');
const router = express.Router();

const API_BASE = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

router.get('/mgnrega/:state', async (req, res) => {
  const { state } = req.params;
  const stateUpper = state.toUpperCase();

  try {
    // CLEAR OLD CACHE
    await MGNREGAData.deleteMany({ state_name: stateUpper });

    let allRecords = [];
    let offset = 0;
    const limit = 100;
    let total = 0;

    // FIRST PAGE
    const firstUrl = `${API_BASE}?api-key=${API_KEY}&format=json&filters[state_name]=${stateUpper}&limit=${limit}&offset=0`;
    const firstRes = await fetch(firstUrl, { timeout: 10000 });
    if (!firstRes.ok) throw new Error(`API ${firstRes.status}`);
    const firstJson = await firstRes.json();
    total = parseInt(firstJson.total) || 0;
    if (firstJson.records) allRecords = firstJson.records;

    // PAGINATION
    const maxRecords = Math.min(total, 1000);
    const batches = Math.ceil(maxRecords / limit) - 1;

    for (let i = 0; i < batches && i < 9; i++) {
      offset += limit;
      const url = `${API_BASE}?api-key=${API_KEY}&format=json&filters[state_name]=${stateUpper}&limit=${limit}&offset=${offset}`;
      const resp = await fetch(url, { timeout: 10000 });
      if (!resp.ok) break;
      const data = await resp.json();
      if (data.records) allRecords.push(...data.records);
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`Fetched ${allRecords.length} records from API`);

    if (allRecords.length === 0) throw new Error('No records');

    // TRANSFORM & SAVE
    const cleanRecords = allRecords
      .filter(r => r.district_name && r.district_name.trim())
      .map(r => {
        // Parse all numeric values with fallback to 0
        const women_persondays = parseFloat(r.Women_Persondays) || 0;
        const households = parseFloat(r.Total_Households_Worked) || 0;
        const expenditure = parseFloat(r.Total_Exp) || 0;

        // Convert persondays to lakhs (1 lakh = 100,000)
        const persondays_lakh = women_persondays / 100000;

        console.log('Processing record:', {
          district: r.district_name,
          raw_persondays: r.Women_Persondays,
          parsed_persondays: women_persondays,
          persondays_lakh,
          households,
          expenditure
        });

        return {
          state_name: r.state_name,
          district_name: r.district_name.trim(),
          fin_year: r.fin_year,
          fin_month: r.month || 'Unknown',
          persondays_lakh: persondays_lakh,
          households: households,
          expenditure_cr: expenditure,
          raw_data: {
            women_persondays: r.Women_Persondays,
            total_households: r.Total_Households_Worked,
            total_exp: r.Total_Exp
          },
          fetchedAt: new Date()
        };
      });

    await MGNREGAData.insertMany(cleanRecords, { ordered: false });

    // Process and validate each record
    const response = allRecords
      .filter(r => r.district_name && r.Women_Persondays && r.Total_Households_Worked && r.Total_Exp)
      .map(r => {
        // Parse all numeric values
        const women_persondays = parseFloat(r.Women_Persondays);
        const households = parseInt(r.Total_Households_Worked);
        const expenditure = parseFloat(r.Total_Exp);

        // Skip invalid records
        if (isNaN(women_persondays) || isNaN(households) || isNaN(expenditure)) {
          console.warn('Invalid record found:', r.district_name);
          return null;
        }

        // Convert to proper units
        const persondays_lakh = (women_persondays / 100000).toFixed(2);
        
        console.log('Processing district:', {
          name: r.district_name,
          month: r.month,
          persondays: persondays_lakh,
          households: households,
          expenditure: expenditure
        });

        return {
          state_name: r.state_name,
          district_name: r.district_name.trim(),
          fin_year: r.fin_year,
          fin_month: r.month || 'Unknown',
          persondays_lakh: persondays_lakh,
          households: households.toString(),
          expenditure_cr: expenditure.toString(),
          raw_data: {
            Women_Persondays: r.Women_Persondays,
            Total_Households_Worked: r.Total_Households_Worked,
            Total_Exp: r.Total_Exp
          }
        };
      })
      .filter(Boolean); // Remove any null records

    console.log(`Processed ${response.length} valid records`);

    return res.json({
      source: 'api',
      records: response,
      count: response.length
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(503).json({ error: error.message });
  }
});

module.exports = router;