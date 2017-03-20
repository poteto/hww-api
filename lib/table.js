const Airtable = require('airtable');
const _string = require('lodash/string');
const _array = require('lodash/array');

const { startCase } = _string;
const { head, flatten } = _array;

/**
 * Table connection to Airtable with convenience methods.
 *
 * @class Table
 */
class Table {
  static clientFor(tableName) {
    let startCasedTableName = startCase(tableName);
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE);
    return base(startCasedTableName);
  }

  /**
   * Creates an connection to Airtable with a TitleCase table name.
   *
   * @param {String} tableName
   * @memberOf Table
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.client = this.constructor.clientFor(tableName);
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
        .eachPage(resolve, (err) => {
          if (err) { reject(err); }
        });
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

  /**
   * Returns found record or creates with props.
   *
   * @param {String} query
   * @param {Object} props
   * @returns {Promise}
   *
   * @memberOf Table
   */
  findOrCreateBy(query, props) {
    return this
      .where(query)
      .then((records) => {
        if (records.length) {
          return head(records);
        }
        return this.create(props);
      });
  }

  /**
   * Fetches all records.
   *
   * @returns {Promise}
   *
   * @memberOf Table
   */
  all() {
    return new Promise((resolve, reject) => {
      let retrievedRecords = [];
      this.client
        .select()
        .eachPage((records, fetchNextPage) => {
          retrievedRecords = [...retrievedRecords, records];
          fetchNextPage();
        }, (err) => {
          if (err) { return reject(err); }
          return resolve(flatten(retrievedRecords));
        });
    });
  }

  /**
   * Update a record.
   *
   * Valid options:
   *   typecast: Boolean
   *
   * @param {String} id
   * @param {Object} props
   * @param {Object} options
   * @returns {Promise}
   *
   * @memberOf Table
   */
  update(id, props, options) {
    return new Promise((resolve, reject) => {
      this.client
        .update(id, props, options, (err, record) => {
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