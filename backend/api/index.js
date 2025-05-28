const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const path = require('path');
// Allow requests from your frontend
const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  };
const dotenv = require('dotenv');
const morgan = require('morgan');
const routes = require('../routes/routes');

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json());


mongoose.connect(process.env.MONGO_URI).then(()=> console.log("DB is connected."))
.catch((err)=> console.error(err));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes)

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=> console.log(`Server is running on PORT ${PORT}`));
