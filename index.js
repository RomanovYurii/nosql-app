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
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

client.connect().then(() => {
  console.log('↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓')
  console.log('')
  console.log('')
  console.log('Connected to MongoDB')
  console.log('')
  console.log('')
  console.log('↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑')
})

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Single student CRUD

// Create
app.post('/student', bodyParser.json(), async (req, res) => {
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Create new student'
  /* #swagger.parameters['body'] = {
        in: 'body',
        '@schema': {
          required: ['first_name', 'last_name'],
            "properties": {
                "first_name": { "type": "string" },
                "last_name": { "type": "string" }
            }
        }
     }
  */

  if (req.body?.first_name === undefined || req.body?.last_name === undefined) {
    res.sendStatus(400)
    return
  }

  const student = await studentsCollection.insertOne(req.body);
  res.send(JSON.stringify(student)).status(200)
})

// Read
app.get('/student', async (req, res) => {
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Get student details'
  /* #swagger.parameters['id'] = {
        in: 'query',
        type: 'string'
     } */
  /* #swagger.parameters['first_name'] = {
        in: 'query',
        type: 'string'
     } */
  /* #swagger.parameters['last_name'] = {
        in: 'query',
        type: 'string'
     } */

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
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Update student details'
  /* #swagger.parameters['body'] = {
        in: 'body',
        '@schema': {
          required: ['id'],
            "properties": {
                "id": { "type": "string" },
                "first_name": { "type": "string" },
                "last_name": { "type": "string" }
            }
        }
     }
  */

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
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Delete student record'
  // #swagger.description = 'Theoretically, this action should delete all student\'s messages as well, but this feature is not implemented yet.'
  /* #swagger.parameters['body'] = {
        in: 'body',
        '@schema': {
          required: ['id'],
            "properties": {
                "id": { "type": "string" }
            }
        }
     }
  */

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
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Create new message'
  /* #swagger.parameters['body'] = {
        in: 'body',
        '@schema': {
          required: ['text', 'student_id'],
            "properties": {
                "text": { "type": "string" },
                "student_id": { "type": "string" }
            }
        }
     }
  */

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
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Get message details'
  /* #swagger.parameters['id'] = {
        in: 'query',
        type: 'string'
     } */

  if (req.query.id === undefined) {
    res.sendStatus(404)
    return
  }
  const message = await messagesCollection.findOne(new ObjectId(req.query.id));
  res.send(JSON.stringify(message)).status(200)
})

// Update
app.put('/message', bodyParser.json(), async (req, res) => {
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Update message details'
  /* #swagger.parameters['body'] = {
        in: 'body',
        '@schema': {
          required: ['id'],
            "properties": {
                "id": { "type": "string" },
                "text": { "type": "string" },
                "student_id": { "type": "string" }
            }
        }
     }
  */

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
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Delete message'
  /* #swagger.parameters['body'] = {
        in: 'body',
        '@schema': {
          required: ['id'],
            "properties": {
                "id": { "type": "string" }
            }
        }
     }
  */

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
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Get all messages of a student by student id'
  /* #swagger.parameters['student_id'] = {
        in: 'query',
        type: 'string'
     } */

  if (req.query.student_id === undefined) {
    res.sendStatus(404)
    return
  }
  const messages = await messagesCollection.find({ student_id: new ObjectId(req.query.student_id) }).toArray();
  res.send(JSON.stringify(messages)).status(200)
})

// Get student details by message id
app.get('/student/detailsByMessageId', async (req, res) => {
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Get student details by message id'
  /* #swagger.parameters['message_id'] = {
        in: 'query',
        type: 'string'
     } */

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
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Get all students'

  const students = await studentsCollection.find().toArray();
  res.send(JSON.stringify(students)).status(200)
})

// Get all messages
app.get('/message/all', async (req, res) => {
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Get all messages'

  const messages = await messagesCollection.find().toArray();
  res.send(JSON.stringify(messages)).status(200)
})

// Remove all messages
app.delete('/message/all', async (req, res) => {
  // #swagger.tags = ['Message']
  // #swagger.summary = 'Delete all messages'

  await messagesCollection.deleteMany({})
  res.sendStatus(200)
})

// Remove all students
app.delete('/student/all', async (req, res) => {
  // #swagger.tags = ['Student']
  // #swagger.summary = 'Delete all students'

  await studentsCollection.deleteMany({})
  res.sendStatus(200)
})

// Feed random data
app.post('/feed', async (req, res) => {
  // #swagger.tags = ['Special']
  // #swagger.summary = 'Feed random data to the database'

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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${ port }`);
});