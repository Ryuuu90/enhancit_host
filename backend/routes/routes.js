const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const {uploadFile, analyseData, questionsClustering, personClustering, questions} = require('../controllers/view')
const {chartExplanation} = require('../controllers/chartExplanation')
const {clustering} = require('../controllers/clustering')




router.post('/upload', upload.single('file'), uploadFile);
router.post('/analysis', analyseData);
// router.post('/questions-rate', questionsClustering);
// router.post('/person-rate', personClustering);
router.post('/chart-explanation', chartExplanation);
router.post('/clustering', clustering);
router.get('/questions', questions);







module.exports = router;