const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

// jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('unauthorized access')
  }
  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2elctou.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const categoriesCollection = client.db('laptobZone').collection('categories')
    const productsCollection = client.db('laptobZone').collection('products')
    const buyCollection = client.db('laptobZone').collection('buy')
    const usersCollection = client.db('laptobZone').collection('user')

    app.get('/categories', async (req, res) => {
      const query = {}
      const categories = await categoriesCollection.find(query).toArray()
      res.send(categories)
    })


    // // categories:id 
    // app.get('/categories/:id', async(req, res) => {
    //   const category_id = req.query.category_id;
    //   const decodedCategoryId = req.decoded.category_id;
    //   const query = {category_id: category_id}
    //   const products = await productsCollection.find(query).toArray();
    //   res.send(products)
    // })

    // categories:id 
    app.get('/categories/:id', async (req, res) => {
      const id = req.params.id;
      const query = { category_id: id }
      const products = await categoriesCollection.find(query).toArray();
      res.send(products)
    })

    // my orders
    app.get('/buy',  async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await buyCollection.find(query).toArray();
      res.send(result)
    })

    // JWT TOKEN
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: '' })
    })

    // user display in website
    app.get('/users', async (req, res) => {
      const query = {}
      const user = await usersCollection.find(query).toArray()
      res.send(user)
    })

    // admin role
    app.get('/users/admin/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.role === 'admin'});
    })

    // seller role
    app.get('/users/seller/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.buyerSeller === 'seller'});
    })

    // user update make a admin
    app.put('/users/admin/:id', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = {email: decodedEmail};
      const user = await usersCollection.findOne(query);

      if(user?.role !== 'admin') {
        return res.status(403).send({message: 'forbidden access'})
      }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
          $set: {
              role: 'admin',
          }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
  })

    // user product buy
    app.post('/buy', async (req, res) => {
      const buy = req.body;
      const result = await buyCollection.insertOne(buy);
      res.send(result)
    })

    // user collection
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

  }

  finally {

  }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
  res.send('laptob zone server running')
})

app.listen(port, () => {
  console.log(`laptob zone server running on port ${port}`)
})