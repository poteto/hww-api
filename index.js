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

app.post('/webhook', (req, res) => {
  let { after: newSha, ref } = req.body;
  let isMaster = ref === 'refs/heads/master';
  if (isMaster && newSha) {
    let commitsUrl = get(req, 'body.repository.commits_url', '').replace('{/sha}', `/${newSha}`);
    fetchCommit(commitsUrl)
      .then(processDiff)
      .catch((err) => winston.error(err));
  }
  res.send('OK');
});

app.listen(app.get('port'), () => {
  winston.info('Node app is running on port', app.get('port'));
});
