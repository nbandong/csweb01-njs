var mongodb = require('mongodb');

const MongoClient = require('mongodb').MongoClient;

module.exports.getAllOrders = async function( request, response )
{
	let dbuser = "csweb01";
	let dbpassword = "csweb01";
	let dbname = "csweb01";
	let url = "mongodb://" + dbuser + ":" + dbpassword + "@ds014388.mlab.com:14388/" + dbname;
	
	//console.log( "Attempting to connect to server" );
	
	let client = await MongoClient.connect( url );
	let ret;
	
	let connected = client.isConnected( dbname );
	if ( connected )
	{
		//console.log( "Connection is good!" );
		
		try
		{
			const db = client.db( dbname );
			let collections = await db.collections();
			
			//console.log( collections );
			
			let orders = db.collection( "orders" );
			
			//console.log( orders );
			
			let allOrders = await orders.find({});
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