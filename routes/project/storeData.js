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

router.post('/', function( request, response, next ) 
{
	(async function() {
		
		let json = JSON.parse( response.body );
		
		let _id = await databaseController.addCustomer( json["checkoutInfo"]["shippingInfo"] );
		
		console.log( _id );
	})();
});

module.exports = router;
