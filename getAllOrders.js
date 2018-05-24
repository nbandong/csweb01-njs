var express = require('express');
var router = express.Router();

let databaseController = require('../../controllers/database.js');

router.get('/', function( request, response, next ) 
{
	(async function() {
		let orders = await databaseController.getAllOrders();
		response.render( "getAllOrders.ejs", { orders: orders } );
	})();
);

router.post('/', function(request, response){
    response.send("Send data information")})

module.exports = router;
