var express = require('express');
var router = express.Router();



router.post('/', function( request, response ) 
{
	//console.log( request.body );
	
	response.status(200).send( request.body );
});

module.exports = router;
