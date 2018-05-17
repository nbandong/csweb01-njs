var express = require('express');
var router = express.Router();

let databaseController = require('../../controllers/database.js');

router.get('/', function( request, response, next ) 
{
	(async function() {
		let orders = await databaseController.getAllOrders();
		response.render( "getAllOrders.ejs", { orders: orders } );
	})();
});

module.exports = router;
