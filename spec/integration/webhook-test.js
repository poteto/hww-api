require('dotenv').config({ path: '../support/.test.env' })
const request = require('supertest');
const app = require('../../index');
const webhookMasterPayload = require('../support/fixtures/webhook-master.json');
const webhookNonMasterPayload = require('../support/fixtures/webhook-non-master.json');

describe('POST /webhook', function() {
  describe('when payload is referencing master', function() {
    it('responds with 201', function(done) {
      request(app)
        .post('/webhook')
        .send(webhookMasterPayload)
        .set('Accept', 'application/json')
        .expect(201, done);
    });
  });

  describe('when payload is not referencing master', function() {
    it('responds with 200', function(done) {
      request(app)
        .post('/webhook')
        .send(webhookNonMasterPayload)
        .set('Accept', 'application/json')
        .expect(200, done);
    });
  })
});