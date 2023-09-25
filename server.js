const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();
const www = process.env.WWW || './dist';
const httpsOptions = {
  key: fs.readFileSync('./ssl/localhost.key'),
  cert: fs.readFileSync('./ssl/localhost.crt'),
};

app.use(express.static(www));
app.get('*', (_, res) => {
  res.sendFile('index.html', { root: www });
});
app.post('*', (_, res) => {
  res.sendFile('index.html', { root: www });
});

http.createServer(app).listen(3000);
https.createServer(httpsOptions, app).listen(3001);
