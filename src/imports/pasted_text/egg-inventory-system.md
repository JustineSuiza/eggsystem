Egg Retail Inventory Management System
1. System Overview

The Egg Retail Inventory Management System is designed to help retailers manage egg products, monitor stock levels, record sales transactions, and track inventory movement. The system ensures accurate inventory records, prevents stock shortages, and improves sales tracking.

The system consists of four main entities:

User

Product

Stock In

Sales

These entities interact to manage inventory and sales activities within the retail store.

2. System Entities
2.1 User

The User represents the person who operates the system such as the store owner, cashier, or inventory staff.

Attributes

User ID (PK) – Unique identifier of the user

Name – Full name of the user

Username – Login username

Password – User password for authentication

Roles – User role (Admin, Staff, Cashier)

Function

Users can:

Add products

Record stock arrivals

Process sales

Monitor inventory

2.2 Product

The Product represents the egg items being sold in the store.

Attributes

Product ID (PK) – Unique identifier of the product

Product Name – Name of the egg product

Price – Selling price per item or tray

Stock Quantity – Available stock in inventory

Date Added – Date the product was added to the system

Function

The product table stores information about all egg products available for sale.

Example:

Small Eggs

Medium Eggs

Large Eggs

Jumbo Eggs

2.3 Stock In

The Stock In entity records new inventory that enters the store.

Attributes

Stock In ID (PK) – Unique ID for stock entry

Quantity Added – Number of eggs added to inventory

Date Received – Date stock was delivered

Product ID (FK) – Related product

User ID (FK) – Staff who recorded the stock

Function

This module tracks when eggs are delivered or restocked.

Example process:

Supplier delivers eggs.

Staff records the quantity in the system.

Product stock quantity increases.

2.4 Sales

The Sales entity records transactions when customers buy eggs.

Attributes

Sale ID (PK) – Unique sale transaction ID

Quantity Sold – Number of eggs sold

Total Amount – Total price of the sale

Sale Date – Date of transaction

Product ID (FK) – Product sold

User ID (FK) – Cashier who recorded the sale

Function

The sales module records all sales transactions and updates the stock quantity.

Example process:

Customer buys eggs.

Cashier enters quantity in the system.

Stock quantity automatically decreases.

3. System Relationships
User → Product

A User adds products to the inventory system.

Relationship:
One User → Many Products

Product → Stock In

A Product receives stock from deliveries.

Relationship:
One Product → Many Stock In Records

Product → Sales

A Product can have many sales transactions.

Relationship:
One Product → Many Sales

User → Sales

A User records sales transactions.

Relationship:
One User → Many Sales

4. System Process Flow
Step 1 – User Login

The system user logs in using their username and password.

Step 2 – Add Product

Admin adds egg products with:

Name

Price

Initial stock

Step 3 – Record Stock In

When new eggs arrive:

Staff enters quantity received

System updates stock quantity

Step 4 – Process Sales

When eggs are sold:

Cashier selects product

Inputs quantity sold

System calculates total price

Stock quantity decreases

Step 5 – Monitor Inventory

The system allows users to:

Check available stock

Track sales

Monitor inventory movement

5. Key Features of the System

Product management

Inventory tracking

Stock-in recording

Sales transaction recording

User account management

Automatic stock updates

6. Benefits of the System

Prevents inventory errors

Tracks egg stock accurately

Records daily sales

Improves store management

Helps avoid stock shortages 