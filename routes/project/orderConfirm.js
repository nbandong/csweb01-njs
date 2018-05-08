var express = require('express');
var router = express.Router();

/*
router.post('/', function( request, response ) 
*/
router.use( function( request, response, next )
{
	var jsonString = JSON.stringify( { x: 5, y: 6 } );
	response.send( jsonString );
});

module.exports = router;
