const express = require('express');
const app = express();
const trackRequests = require('..');
const trackRequestsOptions = {
  elasticSearchOptions: {
    elasticSearchUrl: 'http://127.0.0.1:9200/'
  },
  endpointsBodies:[
    {
      endpoint : '/1',
      body : {
        name: {"type" : "string"},
        email: {"type" : "string"}
      }
    },
    {
      endpoint : '/',
      body : {
        url: {"type" : "string"},
        email: {"type" : "string"}
      }
    }
  ]

};

app.use(express.json());


app.use(trackRequests(trackRequestsOptions));

app.post('/', function(req, res) {
  res.send('Hello World!');
});

app.post('/1', function(req, res) {
  res.send('Hello 1!');
});
app.post('/2', function(req, res) {
  res.send('Hello 2!');
});


app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});


