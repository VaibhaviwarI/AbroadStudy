const express = require("express");

const {
  listPopularUniversities,
  listUniversities,
} = require("../controllers/universityController");

const router = express.Router();

router.get("/popular", listPopularUniversities);
router.get("/", listUniversities);

module.exports = router;
