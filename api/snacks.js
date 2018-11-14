"use strict";

const AWS = require("aws-sdk");
const uuidv4 = require("uuid/v4");
const dynamodb = new AWS.DynamoDB();

exports.handler = (event, context, callback) => {
	const id = event.pathParameters ? event.pathParameters.id : null;
	const { TABLE_NAME } = process.env;
	console.log(event);

	switch (event.httpMethod) {
		//Add a Snack 
		case "POST":
			const snackId = uuidv4();
			dynamodb.putItem(
				{
					Item: AWS.DynamoDB.Converter.marshall({
						...JSON.parse(event.body),
						id: snackId
					}),
					TableName: TABLE_NAME
				},
				(err, data) => {
					if (err)
						callback(null, {
							statusCode: 400,
							headers: {
								"Access-Control-Allow-Origin": "*"
							},
							body: JSON.stringify({ error: err })
						});
					exports.handler(
						{ pathParameters: { id: snackId }, httpMethod: "GET" },
						context,
						callback
					);
				}
			);
			break;

		// get a list of snacks 
		case "GET":
			if (id) {
				dynamodb.getItem(
					{
						Key: AWS.DynamoDB.Converter.marshall({ id }),
						TableName: TABLE_NAME
					},
					(err, data) => {
						if (err)
							callback(null, {
								statusCode: 400,
								headers: {
									"Access-Control-Allow-Origin": "*"
								},
								body: JSON.stringify({ error: err })
							});
						callback(null, {
							statusCode: 200,
							headers: {
								"Access-Control-Allow-Origin": "*"
							},
							body: JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data.Item))
						});
					}
				);
				return;
			}

			dynamodb.scan({ TableName: TABLE_NAME }, (err, data) => {
				if (err)
					callback(null, {
						statusCode: 400,
						headers: {
							"Access-Control-Allow-Origin": "*"
						},
						body: JSON.stringify({ error: err })
					});
				callback(null, {
					statusCode: 200,
					headers: {
						"Access-Control-Allow-Origin": "*"
					},
					body: JSON.stringify(
						data.Items.map(item => AWS.DynamoDB.Converter.unmarshall(item))
					)
				});
			});
			break;

		//update a snack
		case "PUT":
			dynamodb.getItem(
				{
					Key: AWS.DynamoDB.Converter.marshall({ id }),
					TableName: TABLE_NAME
				},
				(err, data) => {
					if (err)
						callback(null, {
							statusCode: 400,
							headers: {
								"Access-Control-Allow-Origin": "*"
							},
							body: JSON.stringify({ error: err })
						});

					const retrievedItem = AWS.DynamoDB.Converter.unmarshall(data.Item);

					const newItem = {
						...retrievedItem,
						...JSON.parse(event.body),
						id
					};

					dynamodb.putItem(
						{
							Item: AWS.DynamoDB.Converter.marshall(newItem),
							TableName: TABLE_NAME
						},
						(err, data) => {
							if (err)
								callback(null, {
									statusCode: 400,
									headers: {
										"Access-Control-Allow-Origin": "*"
									},
									body: JSON.stringify({ error: err })
								});
							callback(null, {
								statusCode: 200,
								headers: {
									"Access-Control-Allow-Origin": "*"
								},
								body: JSON.stringify(
									data.Items.map(item =>
										AWS.DynamoDB.Converter.unmarshall(item)
									)
								)
							});
						}
					);
				}
			);
			break;

		// snarf a snack
		case "DELETE":
			dynamodb.deleteItem(
				{
					Key: AWS.DynamoDB.Converter.marshall({ id }),
					TableName: TABLE_NAME
				},
				(err, data) => {
					if (err)
						callback(null, {
							statusCode: 400,
							headers: {
								"Access-Control-Allow-Origin": "*"
							},
							body: JSON.stringify({ error: err })
						});
					callback(null, {
						statusCode: 200,
						headers: {
							"Access-Control-Allow-Origin": "*"
						},
						body: JSON.stringify({})
					});
				}
			);
			break;

		// all other http methods default with error message of unsupported
		default:
			const message = `Unsupported HTTP method ${event.httpMethod}`;
			createResponse(message, null, callback);
	}
};
