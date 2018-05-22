var mongodb = require('mongodb');

const MongoClient = require('mongodb').MongoClient;

let DB_USER = "csweb01";
let DB_PASSWORD = "csweb01";
let DB_NAME = "csweb01";
let DB_DOMAIN = "ds014388.mlab.com:14388";

async function connect()
{
	let url = "mongodb://" + DB_USER + ":" + DB_PASSWORD + "@" + DB_DOMAIN + "/" + DB_NAME;
	
	let client = await MongoClient.connect( url, { useNewUrlParser: true } ); // Added the useNewUrlParser option to suppress warning about it.
	
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

// addCustomer() adds a customer to the database, or gets the customer if already present in database. Returns the customer's _id, or null on failure.
module.exports.addCustomer = async function( info )
{
	/*
		info is an associative array of the structure:
		
		{
			"name" : string,
			"email" : string,
			"address" : string,
			"address2" : string,
			"city" : string,
			"state" : string,
			"zip" : string
		}
	*/
	
	console.log( "addCustomer() START" );
	
	let client = await connect();
	let ret = null;
	
	if ( client.isConnected( DB_NAME ) )
	{
		try
		{
			const db = client.db( DB_NAME );
			
			let customers = db.collection( "customers" );
			
			// Check if the customer is already in the collection.
			
			let selectQuery = {
				"email": true
			}
			
			let whereQuery = {
				"email": info[ "email" ]
			}
			
			let queryResult = await customers.findOne( whereQuery, selectQuery );
			
			if ( queryResult == null )
			{
				// Customer not found in the db, try inserting the customer in.
				
				console.log( "Customer with email " + info[ "email" ] + " not found, inserting new one." );
				
				let insertResult = await customers.insertOne( info ); // insertOne() returns an Object of type insertOneWriteOpResultObject.
				
				console.log( "Insertion result: " + insertResult.result.ok );
				
				if ( insertResult.result.ok == 1 )
				{
					// Inserted into database just fine. Return the _id.
					ret = insertResult.insertedId;
				}
			}
			else
			{
				console.log( "Customer with email " + info[ "email" ] + " found!" );
				ret = queryResult[ "_id" ]; // _id is always included in result of query, regardless if specified to be included or not.
			}
		}
		catch ( err )
		{
			console.log( err.stack );
		}
	}
	
	client.close();
	
	console.log( "addCustomer() END" );
	
	return ret;
}