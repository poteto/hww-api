const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('app3GPfBakzyWI8WO');

const extractCompanyName = (str) => {
  let [matched] = str.match(/\[(.*?)\]/g);
  return matched.substring(1, matched.length - 1);
};

const processor = (addition) => {
  let [company, location, description] = addition.split('|').map((s) => s.trim());
  let extractedCompany = extractCompanyName(company);

  base('Raw').create({
    Company: extractedCompany,
    Location: location,
    Description: description
  }, function(err, record) {
    if (err) { console.error(err); return; }
    console.log(record.getId());
  });
};

module.exports = processor;