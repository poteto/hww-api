const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE);

/**
 * Table connection to Airtable with convenience methods.
 *
 * @class Table
 */
class Table {
  /**
   * Creates an connection to Airtable with a TitleCase table name.
   *
   * @param {String} tableName
   * @memberOf Table
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.client = base(tableName);
  }

  /**
   * See https://support.airtable.com/hc/en-us/articles/203255215-Formula-Field-Reference
   * for details on query syntax.
   *
   * For example, to only include records where Name isn't empty, pass in:
   * `NOT({Name} = '')`
   *
   * @param {String} query
   * @returns {Promise}
   *
   * @memberOf Table
   */
  where(query) {
    return new Promise((resolve, reject) => {
      this.client
        .select({ filterByFormula: query })
        .eachPage(resolve, reject);
    });
  }

  /**
   * Creates a new record.
   *
   * @param {Object} props
   * @returns {Promise}
   *
   * @memberOf Table
   */
  create(props) {
    return new Promise((resolve, reject) => {
      this.client
        .create(props, (err, record) => {
          if (!err) {
            resolve(record);
          } else {
            reject(err);
          }
        });
    });
  }
}

module.exports = Table;