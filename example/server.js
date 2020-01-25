const express = require('express');
const app = express();
const trackRequests = require('..');
const trackRequestsOptions = {
  elasticSearchOptions: {
    elasticSearchUrl: 'http://127.0.0.1:9200/'
  }
};
app.use(trackRequests(trackRequestsOptions));

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});


