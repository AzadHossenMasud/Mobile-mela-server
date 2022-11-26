const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken')

require('dotenv').config()


// middleware
app.use(cors())
app.use(express.json())
 console.log(process.env.DB_PASSWORD)

//  Mongo DB

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2kitjkk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async ()=>{
  try{

    const usersCollection = client.db('phoneMela').collection('users')
    
    // POST
    app.post('/users', async(req, res)=>{
      const userInfo = req.body
      const result = await usersCollection.insertOne(userInfo)
      res.send(result)
    })


    // app.get('/jwt', async(req, res)=>{

    // })
  }finally{

  }
}

run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Phone Mela server running on port ${port}`)
})