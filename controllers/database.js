var mongodb = require('mongodb');

const MongoClient = require('mongodb').MongoClient;

let DB_USER = "csweb01";
let DB_PASSWORD = "csweb01";
let DB_NAME = "csweb01";
let DB_DOMAIN = "ds014388.mlab.com:14388";

// Helper function of connecting to the database. Returns MongoClient Object.
async function connect()
{
	let url = "mongodb://" + DB_USER + ":" + DB_PASSWORD + "@" + DB_DOMAIN + "/" + DB_NAME;
	
	let client = await MongoClient.connect( url, { useNewUrlParser: true } ); // Added the useNewUrlParser option to suppress warning about it.
	
	return client;
}

// Helper function of inserting a single document into a collection.
// Returns the _id of the inserted document on success, or null on failure.
async function insert( db, collectionName, document )
{
	let ret = null;
	let collection = db.collection( collectionName );
	let insertResult = await collection.insertOne( document ); // insertOne() returns an Object of type insertOneWriteOpResultObject.
	
	console.log( "Insertion result: " + insertResult.result.ok );
	
	if ( insertResult.result.ok == 1 )
		ret = insertResult.insertedId;
	
	return ret;
}

// getCustomerId() gets the customer in the database, or attempts to create a new customer entry if not present. 
// Returns the customer's _id on success, or null on failure.
async function getCustomerId( db, info )
{
	/*
		info is an associative array. It can contain anything you want, as long as all values are strings.
		
		This structure is what I use for my project:
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
	
	console.log( "getCustomerId() START" );
	
	let ret = null;
	
	try
	{
		// Check if the customer is already in the collection.
		
		let selectQuery = {
			"email": true
		}
		
		let whereQuery = {
			"email": info[ "email" ]
		}
		
		let queryResult = await db.collection( "customers" ).findOne( whereQuery, selectQuery );
		if ( queryResult == null )
		{
			// Customer not found in the db, try inserting the customer in.
			
			console.log( "Customer with email " + info[ "email" ] + " not found, inserting new one." );
			
			ret = await insert( db, "customers", info );
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
	
	console.log( "getCustomerId() END" );
	
	return ret;
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

// Returns true if ALL data was successfully written to the database; false otherwise.
module.exports.storeData = async function( data )
{
	// data is an associative array.
	
	/*
		In my project, I store the data all in one single array, like so:
		
		data
		{
			"checkoutInfo" : 
			{
				"shippingInfo" :
				{
					"name" : string,
					"email" : string,
					"address" : string,
					"address2" : string,
					"city" : string,
					"state" : string,
					"zip" : number
				},
				
				"billingInfo" :
				{
					"name" : string,
					"email" : string,
					"address" : string,
					"address2" : string,
					"city" : string,
					"state" : string,
					"zip" : number
				},
				
				"paymentInfo" :
				{
					"ccNumber" : number,
					"ccExpMonth" : string,
					"ccExpYear" : number,
					"ccCVC" : number
				}
			},
			
			"cartItems" :
			[
				{
					"name" : string,
					"price" : number,
					"count" : number
				},
				
				{
					"name" : string,
					"price" : number,
					"count" : number
				},
				
				...
			]
		}
		
		You might have a different structure than mine, but you can repurpose the code to fit your chosen structure. 
		This is how the data is assumed to be sent to this function in my case.
	*/
	
	let client = await connect();
	let ret = false;
	
	console.log( "Incoming data: " );
	console.log( data );
	
	let connected = client.isConnected( DB_NAME );
	if ( connected )
	{
		try
		{
			const db = client.db( DB_NAME );
			
			// Store the customer info first. In my case, I use the billing info.
			
			// getCustomerId() checks if there are no duplicate customers with same email. If checking for duplicates isn't important, then use insert() helper function instead and create document.
			let customerId = await getCustomerId( db, data.checkoutInfo.billingInfo );
			if ( customerId != null )
			{
				let billingDocument = {
					"customer_id" : customerId,
					"creditCardNum" : data.checkoutInfo.paymentInfo.ccNumber,
					"creditCardExpMonth" : data.checkoutInfo.paymentInfo.ccExpMonth,
					"creditCardExpYear" : data.checkoutInfo.paymentInfo.ccExpYear,
					"creditCardSecurityNum" : data.checkoutInfo.paymentInfo.ccCVC
				};
				
				// Insert billing.
				let billingId = await insert( db, "billing", billingDocument );
				if ( billingId != null )
				{
					let shippingDocument = {
						"customer_id" : customerId,
						"address" : data.checkoutInfo.shippingInfo.address,
						"address2" : data.checkoutInfo.shippingInfo.address2,
						"city" : data.checkoutInfo.shippingInfo.city,
						"state" : data.checkoutInfo.shippingInfo.state,
						"zip" : data.checkoutInfo.shippingInfo.zip
					};
					
					// Insert shipping.
					let shippingId = await insert( db, "shipping", shippingDocument );
					if ( shippingId != null )
					{
						let productList = data.cartItems; // this is PRODUCT_VECTOR.
						let date = new Date().toString(); // The current date as a string.
						let orderTotal = productList.length // unsure of what orderTotal means; assuming it means the amount of items in productList?
						
						let orderDocument = {
							"customer_id" : customerId,
							"billing_id" : billingId,
							"shipping_id" : shippingId,
							"date" : date,
							"orderTotal" : orderTotal,
							"product_vector" : productList
						};
						
						// Finally, insert order.
						let orderId = await insert( db, "orders", orderDocument );
						if ( orderId != null )
						{
							// Set to true as return value so client knows the whole transaction was successful.
							ret = true;
						}
					}
				}
			}
		}
		catch ( err )
		{
			console.log( err.stack );
		}
	}
	
	client.close();
	
	return ret;
}