const { MongoClient, ObjectId } = require('mongodb');
const { randFirstName, randLastName, randNumber, randCatchPhrase } = require("@ngneat/falso");
require('dotenv').config();

const url = `mongodb://${ process.env.MONGO_DB_USER }:${ process.env.MONGO_DB_PASS }@${ process.env.NODE_ENV === 'development' ? process.env.MONGO_SERVER_DEV : process.env.MONGO_SERVER_PROD }:${ process.env.MONGO_DB_PORT }`;
const client = new MongoClient(url);
const dbName = process.env.MONGO_DB_NAME;
const db = client.db(dbName);
const studentsCollection = db.collection('students');
const messagesCollection = db.collection('messages');

const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const port = process.env.SERVER_PORT;

client.connect().then(() => console.log('Connected to MongoDB'))


// Single student CRUD

// Create
app.post('/student', bodyParser.json(), async (req, res) => {
  if (req.body?.first_name === undefined || req.body?.last_name === undefined) {
    res.sendStatus(400)
    return
  }

  const student = await studentsCollection.insertOne(req.body);
  res.send(JSON.stringify(student)).status(200)
})

// Read
app.get('/student', async (req, res) => {
  if (Object.keys(req.query).length === 0) {
    res.sendStatus(404)
    return
  }

  const students = await studentsCollection.findOne({
    $or: [
      req.query,
      { _id: new ObjectId(req.query.id) }
    ]
  });

  res.send(JSON.stringify(students)).status(200)
})

// Update
app.put('/student', bodyParser.json(), async (req, res) => {
  const body = req.body;
  if (body?.id === undefined) {
    res.sendStatus(400)
    return
  }

  let student = await studentsCollection.findOne(new ObjectId(body.id));

  delete body.id

  await studentsCollection.updateOne({ _id: student._id }, { $set: req.body });
  student = await studentsCollection.findOne({ _id: student._id })
  res.send(JSON.stringify(student)).status(200)
})

// Delete
app.delete('/student', bodyParser.json(), async (req, res) => {
  if (req.body?.id === undefined && req.body?.index === undefined) {
    res.sendStatus(400)
    return
  }

  const student = await studentsCollection.findOne(new ObjectId(req.body.id))

  await studentsCollection.deleteOne({ _id: student._id });
  res.sendStatus(200)
})

// Messages CRUD

// Create
app.post('/message', bodyParser.json(), async (req, res) => {
  if (req.body?.text === undefined || req.body?.student_id === undefined) {
    res.sendStatus(400)
    return
  }

  await messagesCollection.insertOne({
    text: req.body.text,
    student_id: new ObjectId(req.body.student_id)
  });
  res.sendStatus(200)
})

// Read
app.get('/message', async (req, res) => {
  if (req.query.id === undefined) {
    res.sendStatus(404)
    return
  }
  const message = await messagesCollection.findOne(new ObjectId(req.query.id));
  res.send(JSON.stringify(message)).status(200)
})

// Update
app.put('/message', bodyParser.json(), async (req, res) => {
  const body = req.body;
  if (body?.id === undefined) {
    res.sendStatus(400)
    return
  }

  const _id = new ObjectId(body.id)
  delete body.id

  await messagesCollection.updateOne({ _id }, { $set: req.body });
  res.send(await messagesCollection.findOne({ _id })).status(200)
})

// Delete
app.delete('/message', bodyParser.json(), async (req, res) => {
  if (req.body?.id === undefined) {
    res.sendStatus(400)
    return
  }

  await messagesCollection.deleteOne({ _id: new ObjectId(req.body.id) });
  res.sendStatus(200)
})

// Special actions

// Get all messages of a student
app.get('/message/allByStudentId', async (req, res) => {
  if (req.query.student_id === undefined) {
    res.sendStatus(404)
    return
  }
  const messages = await messagesCollection.find({ student_id: new ObjectId(req.query.student_id) }).toArray();
  res.send(JSON.stringify(messages)).status(200)
})

// Get student details by message id
app.get('/student/detailsByMessageId', async (req, res) => {
  if (req.query.message_id === undefined) {
    res.sendStatus(404)
    return
  }

  const message = await messagesCollection.findOne(new ObjectId(req.query.message_id));
  const student = await studentsCollection.findOne({ _id: message.student_id });
  res.send(JSON.stringify(student)).status(200)
})

// Other

// Get all students
app.get('/student/all', async (req, res) => {
  const students = await studentsCollection.find().toArray();
  res.send(JSON.stringify(students)).status(200)
})

// Get all messages
app.get('/message/all', async (req, res) => {
  const messages = await messagesCollection.find().toArray();
  res.send(JSON.stringify(messages)).status(200)
})

// Remove all messages
app.delete('/message/all', async (req, res) => {
  await messagesCollection.deleteMany({})
  res.sendStatus(200)
})

// Remove all students
app.delete('/student/all', async (req, res) => {
  await studentsCollection.deleteMany({})
  res.sendStatus(200)
})

// Feed random data
app.post('/feed', async (req, res) => {
  const students = await studentsCollection.insertMany(
    new Array(randNumber({ min: 2, max: 100 }))
      .fill(0)
      .map(() => ({
        first_name: randFirstName(),
        last_name: randLastName(),
      })))

  for (let id of Object.values(students.insertedIds)) {
    await messagesCollection.insertMany(new Array(randNumber({ min: 2, max: 100 })).fill(0).map(() => ({
      text: randCatchPhrase(),
      student_id: id,
    })))
  }

  return res.sendStatus(200)
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${ port }`);
});