const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb://localhost:27017/';
const dbName = 'file_mapping';
const collectionName = 'files';

const hostname = 'localhost';
const port = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const filename = path.basename(pathname);
  const extname = path.extname(pathname).substring(1);
  const urlPath = pathname.substring(1);

  MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
      console.error(err.message);
      res.statusCode = 500;
      res.end('Internal Server Error');
      return;
    }
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    collection.findOne({ requested_name: urlPath }, (err, result) => {
      if (err) {
        console.error(err.message);
        res.statusCode = 500;
        res.end('Internal Server Error');
      } else if (result) {
        const originalName = result.original_name;
        const fileStream = fs.createReadStream(originalName);
        fileStream.on('error', (err) => {
          console.error(err.message);
          res.statusCode = 500;
          res.end('Internal Server Error');
        });
        res.setHeader('Content-Type', `image/${extname}`);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        fileStream.pipe(res);
      } else {
        res.statusCode = 404;
        res.end('File Not Found');
      }
      client.close();
    });
  });
});

MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error(err.message);
    return;
  }
  const db = client.db(dbName);
  db.createCollection(collectionName, (err, collection) => {
    if (err) {
      console.error(err.message);
      return;
    }
    collection.insertOne({ requested_name: 'name', original_name: 'title.jpg' });
    console.log('File mapping added to database');
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
const multer = require('multer');

const upload = multer({
  dest: 'uploads/'
});
const express = require('express');
const app = express();

app.post('/upload', upload.single('file'), (req, res) => {
  const requestName = req.body.name;
  const fileName = req.file.filename;
  pool.query(
    'INSERT INTO files (request_name, file_name) VALUES (?, ?)',
    [requestName, fileName],
    (error, results) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        res.redirect('/');
      }
    }
  );
});