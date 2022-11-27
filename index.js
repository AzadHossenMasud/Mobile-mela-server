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

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization
  if(!authHeader){
    return res.status(401).send({message : 'unauthorize access'})
  }

  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode)=>{
    if(err){
      return res.status(403).send({message : 'forbided access'})
    }
    req.decode = decode
    next();
  })
}

const run = async ()=>{
  try{

    const usersCollection = client.db('phoneMela').collection('users')
    // GET

    app.get('/users',verifyJWT, async(req,res)=>{
      const email = req.query.email
      const query ={
        email: email
      }
      const user = await usersCollection.findOne(query)
      // console.log(user);
      res.send(user)
    })
    // POST
    app.post('/users', async(req, res)=>{
      const userInfo = req.body

      const query = {
        email : userInfo.email
      }

      const user = await usersCollection.findOne(query)
      // console.log(user)
      if(!user){
        const result = await usersCollection.insertOne(userInfo)
       return res.send(result)
      } 
        res.send({achknowledge: true})
      
    })

  // JWT
    app.get('/jwt', async(req, res)=>{
      const email = req.query.email
      const query ={
        email:email
      }

      const user = await usersCollection.findOne(query)
      if(user){
        const token = jwt.sign({email}, process.env.ACCESS_TOKEN , { expiresIn: '1h' } )
        return res.send({accessToken: token})

      }
      res.status(403).send({accessToken: 'forbidded'})
    })
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