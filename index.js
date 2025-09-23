const express = require('express')
const app = express()
const port = 3001

app.use(express.json())
app.get('/', (req, res) => {
  res.json({"Books": [
    { "title": "Book 1" },
    { "title": "Book 2" },
  ]})
})

app.post('/books', (req, res) => {
 const body=req.body
  res.send("Book created, youve sent: "+JSON.stringify(body))
})

app.get('/greet', (req, res) => {
  const personName = req.query.q || 'Guest'
  res.json({"message": `Hello, ${personName}!`})
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})