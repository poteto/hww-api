const winston = require('winston');
const Table = require('../lib/table');
const extractors = require('../lib/extractors');

const { extractKeywords } = extractors;

const addKeywordsToJobs = () => {
  let jobsTable = new Table('Jobs');
  return jobsTable
    .all()
    .then((jobs) => {
      return jobs.map((job) => {
        let id = job.getId();
        let description = job.get('Process');

        return extractKeywords(description)
          .then((keywords) => jobsTable.update(id, { 'Keywords': [...keywords] }, { typecast: true }))
          .catch((err) => winston.error(err));
      });
    })

}

module.exports = addKeywordsToJobs;