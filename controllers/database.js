var mongodb = require('mongodb');

const MongoClient = require('mongodb').MongoClient;

let DB_USER = "csweb01";
let DB_PASSWORD = "csweb01";
let DB_NAME = "csweb01";
let DB_DOMAIN = "ds014388.mlab.com:14388";

async function connect()
{
	let url = "mongodb://" + DB_USER + ":" + DB_PASSWORD + "@" + DB_DOMAIN + "/" + DB_NAME;
	
	let client = await MongoClient.connect( url );
	
	return client;
}

module.exports.getAllOrders = async function( request, response )
{
	//console.log( "Attempting to connect to server" );
	
	let client = await connect();
	let ret = null;
	
	let connected = client.isConnected( DB_NAME );
	if ( connected )
	{
		//console.log( "Connection is good!" );
		
		try
		{
			const db = client.db( DB_NAME );
			
			let orders = db.collection( "orders" );
			
			let allOrders = await orders.find( {} );
			ret = allOrders.toArray();
		}
		catch ( err )
		{
			console.log( err.stack );
		}
	}
	
	client.close();
	
	//console.log( "Connection closed!" );
	
	return ret;
};

// addCustomer() adds a customer to the database. Returns the customer's _id.
module.exports.addCustomer = async function( info )
{
	/*
		info is an associative array of the structure:
		
		{
			"firstName" : string,
			"lastName" : string,
			"address" : string,
			"address2" : string,
			"city" : string,
			"state" : string,
			"zip" : string,
			"email" : string
		}
	*/
	
	let client = await connect();
	let ret = null;
	
	if ( client.isConnected( DB_NAME ) )
	{
		try
		{
			const db = client.db( DB_NAME );
			
			let customers = db.collection( "customers" );
			
			console.log( customers );
			
			// Check if the customer is already in the collection.
			
			let selectQuery = {
				"_id": true,
				"email": true
			}
			
			let whereQuery = {
				"email": info[ "email" ]
			}
			
			let doc = await customers.findOne( whereQuery, selectQuery );
			
			console.log( doc );
			
			if ( doc == null )
			{
				doc = await customers.insertOne( info );
				
				console.log( doc );
			}
			
			ret = doc[ "_id" ];
		}
		catch ( err )
		{
			console.log( err.stack );
		}
	}
	
	client.close();
	
	return ret;
}