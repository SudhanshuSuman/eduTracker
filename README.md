# eduTracker

A **REST API** that brings together, common services which are used by students and teachers for online education.

It aims at making things like tracking attendance, marks, sharing study materials, assignments, etc. for various courses, simple and convenient.

Gives an option to post details about events or activities being organised by an institution

### How to run:
- Development Environment Variables
  - Create a file named `dev.env` in `src/config` directory
  - Add variables PORT and MONGODB_URL
  - Example:
  ```
  PORT=3000
  MONGODB_URL=mongodb://127.0.0.1:27017/eduTracker
  ```
- Start MongoDB server
- Install the required packages by running `npm install`
- Now start the project in dev by running `npm start dev`
