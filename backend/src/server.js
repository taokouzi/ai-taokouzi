require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174"
]

app.use(cors({
  origin: (origin, cb)=>{
    if(!origin || allowedOrigins.includes(origin)){
      cb(null,true)
    }else{
      cb(new Error("跨域拒绝"))
    }
  },
  credentials:true
}))

app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || null,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
})

app.get('/api/ping',(req,res)=>{
  res.json({msg:'ok'})
})

app.get('/api/articles', async (req,res)=>{
  try{
    const result = await pool.query('select * from articles order by id desc')
    res.json(result.rows)
  }catch(e){
    res.status(500).json({error:e.message})
  }
})

app.listen(PORT,()=>console.log(`Server listening on ${PORT}`))
