const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const {uploadFile, analyseData, questionsClustering, personClustering} = require('../controllers/analysis')
const {chartExplanation} = require('../controllers/chartExplanation')
const {clustering} = require('../controllers/clustering')
const {questions} = require('../controllers/questions')





// router.post('/upload', upload.single('file'), uploadFile);
router.post('/analysis', analyseData);
// router.post('/questions-rate', questionsClustering);
// router.post('/person-rate', personClustering);
router.post('/chart-explanation', chartExplanation);
router.post('/clustering', clustering);
router.post('/questions', questions);







module.exports = router;