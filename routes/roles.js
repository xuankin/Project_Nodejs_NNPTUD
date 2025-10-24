var express = require('express');
var router = express.Router();
let roleSchema = require('../schemas/roles')

/* GET users listing. */
router.get('/', async function(req, res, next) {
  let roles = await roleSchema.find({isDeleted:false});
  res.send({
    success:true,
    data:roles
  });
});
router.get('/:id', async function(req, res, next) {
  try {
    let role = await roleSchema.findById(req.params.id);
    res.send({
    success:true,
    data:role
  });
  } catch (error) {
    res.status(404).send({
      success:false,
      data:error
    })
  }
 
});

router.post('/', async function(req, res, next) {
  let newRole = new roleSchema({
    name:req.body.name
  })
  await newRole.save();
  res.send({
      success:true,
      data:newRole
    })
});

module.exports = router;
