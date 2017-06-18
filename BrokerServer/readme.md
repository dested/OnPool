Server Broker 
=============


A simple real time server messaging manager, the next best thing to managing your own socket connections


Goals
=====

Real time messaging between n servers


Cluster
=======
Just another serverbroker that sits between the other server brokers


API
===

Connect to Broker
Join a pool
Get servers in pool
Message pool
	Round robin
Message Server
Register to listen for messages
	by pool
	by ID

Send message with server response
	request response



Servers have IDs not IPs
All messages have reciepts 
	who got my Message
	did anyone get my message


Workflow
========


External Server connects
Joins a pool (game servers)
Query for 



Server connects
	eligible for communcation
	assigned an ID
server says join pool A
server says join pool B
server sends message to pool a (round robin)
someone receives it
