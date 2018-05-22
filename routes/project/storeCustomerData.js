var express = require('express');
var router = express.Router();

let databaseController = require('../../controllers/database.js');

router.post('/', function( request, response, next ) 
{
	(async function() 
	{
		// request.body is automatically parsed as JSON by bodyParser module, so no need to use JSON.parse()
		
		let _id = await databaseController.addCustomer( request.body );
		
		console.log( _id );
		
		response.status(200).send();
	})();
});

module.exports = router;
