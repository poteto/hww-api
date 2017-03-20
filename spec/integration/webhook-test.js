require('dotenv').config({ path: './spec/support/.test.env' }) // absolute path
const request = require('supertest');
const app = require('../../index');
const webhookMasterPayload = require('../support/fixtures/webhook-master.json');
const webhookNonMasterPayload = require('../support/fixtures/webhook-non-master.json');
const generateGithubHeader = require('../support/helpers/generate-github-header');
const generateSignature = require('../support/helpers/generate-signature');

let headers;

describe('POST /webhook', function() {
  describe('when payload is referencing master', function() {
    beforeEach(function() {
      headers = generateGithubHeader({
        event: 'push',
        delivery: 'abcd',
        signature: generateSignature(process.env.GITHUB_WEBHOOK_SECRET, webhookMasterPayload)
      });
    });

    it('responds with 201', function(done) {
      request(app)
        .post('/webhook')
        .set(headers)
        .send(webhookMasterPayload)
        .expect(201, done);
    });
  });

  describe('when payload is not referencing master', function() {
    beforeEach(function() {
      headers = generateGithubHeader({
        event: 'push',
        delivery: 'abcd',
        signature: generateSignature(process.env.GITHUB_WEBHOOK_SECRET, webhookNonMasterPayload)
      });
    });

    it('responds with 200', function(done) {
      request(app)
        .post('/webhook')
        .set(headers)
        .send(webhookNonMasterPayload)
        .expect(200, done);
    });
  })
});