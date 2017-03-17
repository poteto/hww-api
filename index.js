const bodyParser = require('body-parser');
const express = require('express');
const fetchCommit = require('./lib/fetch-commit');
const processorFn = require('./lib/processor');

const app = express();

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.post('/webhook', function(request, response) {
  let newSha = request.body.after;

  if (newSha) {
    let commitsUrl = request.body.repository.commits_url.replace('{/sha}', `/${newSha}`);
    fetchCommit(commitsUrl, processorFn);
  }

  response.send('OK');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
