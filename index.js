const bodyParser = require('body-parser');
const express = require('express');
const winston = require('winston');
const _object = require('lodash/object');
const { get } = _object;

const fetchCommit = require('./lib/fetch-commit');
const processDiff = require('./lib/process-diff');

const app = express();

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.post('/webhook', function(request, response) {
  let newSha = request.body.after;
  if (newSha) {
    let commitsUrl = get(request, 'body.repository.commits_url', '').replace('{/sha}', `/${newSha}`);
    fetchCommit(commitsUrl)
      .then(processDiff)
      .catch((err) => winston.error(err));
  }
  response.send('OK');
});

app.listen(app.get('port'), function() {
  winston.info('Node app is running on port', app.get('port'));
});
