# Natours

Natours is a cloud-enabled, hosted database, ReactJS powered by NodeJS application for booking the Tour.

- View all the available tours
- Login using common password "test1234"
- For admin login use "admin@natours.io" as a username

# Initial Phase To Start Using The Application

- Import a data from the json file to your MongoDB database which can be done using the following line of code from the terminal
  "node dev-data/data/import-dev-data.js --import"
- To delete the data from the database the following line of code must be used
  "node dev-data/data/import-dev-data.js --delete"
  Note:
  While doing the IMPORT data part the following section in the userModel.js file should be commented out, however, after completion of import it must be in its original state.

You can also:

- View the Booked Tours from the profile page
- Pay for the Tour using Stripe Payment Integration system
