const express = require('express');

class ServerFactory {
  constructor() {
    this.createSever = function(port, middelwares, routes) {
      const app = express();
      for (let middelware of middelwares) {
        app.use(middelware);
      }
      for (let route of routes) {
        app[route.method](route.endpoint, route.controller);
      }
      app.listen(port);
      return app;
    };
  }
}

module.exports = ServerFactory;