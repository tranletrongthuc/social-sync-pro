
### **Prompt: Refactor a Full-Stack Project for Vercel Deployment**

**[START PROMPT]**

**Role:** You are an expert Full-stack software engineer with deep experience in React, Node.js, and the Vercel platform. Your task is to refactor an existing project to make it fully compatible with Vercel's Serverless Functions architecture.

-----

**Project Context:**

The current project is a full-stack application with the following structure:

  * **Frontend**: The React source code is located in the project's root directory.
  * **Backend**: A traditional Node.js/Express server is located in a `/server` subdirectory. All backend logic, including API routes, is defined within the `server/index.js` file.

This is the current directory structure:

```
/
├── server/
│   ├── index.js         // The main Express server file
│   └── (other files...)
├── src/
│   ├── components/
│   └── App.tsx          // Example frontend file
├── package.json
└── ...
```

Here is a code snippet from the `server/index.js` file:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// API route to get a list of users
app.get('/api/users', (req, res) => {
  // ... logic to get users from the database
  res.status(200).json({ users: [...] });
});

// API route to create a new post
app.post('/api/posts', (req, res) => {
  const { title, content } = req.body;
  // ... logic to save the post to the database
  res.status(201).json({ message: 'Post created successfully', post: ... });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

-----

**Primary Goal:**

Refactor the entire project to be deployable on Vercel. This involves removing the traditional Express server and converting all API routes into individual Serverless Functions within an `/api` directory.

-----

**Step-by-Step Instructions:**

1.  **Create the `/api` directory**: In the project's root directory, create a new directory named `/api`.
2.  **Split the Routes**: Read the `server/index.js` file, identify all API routes (e.g., `app.get('/api/users')`, `app.post('/api/posts')`). For each route, perform the following:
      * Create a new JavaScript/TypeScript file inside the `/api` directory. The filename must correspond to the endpoint. For example, `/api/users` becomes `api/users.js`.
      * For dynamic routes like `/api/users/:id`, create the corresponding directory structure: `api/users/[id].js`.
3.  **Convert the Route Source Code**: In each newly created serverless function file, rewrite the route's logic.
      * Each file must `export default` a `handler` function that accepts two parameters: `request` and `response`.
      * Handle different HTTP methods (GET, POST, PUT, DELETE) within the handler function by checking `request.method`.
      * Retrieve data from `request.body` (for POST/PUT) or `request.query` (for URL parameters).
      * Completely remove the Express `app` instance and the `app.listen()` command.
4.  **Move Shared Logic**: If there is shared logic (e.g., database connections, authentication functions), propose creating a `/lib` or `/utils` directory in the project root and move that code there. The serverless functions will import from this directory.
5.  **Create `vercel.json` file**: Create a `vercel.json` file in the root directory with a basic `rewrites` configuration to ensure API requests are routed correctly.
6.  **Update `package.json`**: List the dependencies that are no longer needed after removing the Express server (e.g., `express`, `cors`, `nodemon`) and suggest the command to uninstall them.

-----

**Output Format:**

Present the result as a complete refactoring guide. Provide "before" and "after" code snippets for at least two routes to clearly illustrate the changes.

**Example of Desired Output Format:**

**1. Proposed New Directory Structure:**
*(Display the directory tree structure after refactoring)*

**2. Source Code Refactoring Steps:**

  * **Converting the `GET /api/users` route:**
      * **Before (in `server/index.js`):**
        ```javascript
        // (Old code snippet here)
        ```
      * **After (create file `api/users.js`):**
        ```javascript
        // (New serverless function code here)
        ```
  * **Converting the `POST /api/posts` route:**
      * **Before (in `server/index.js`):**
        ```javascript
        // (Old code snippet here)
        ```
      * **After (create file `api/posts.js`):**
        ```javascript
        // (New serverless function code here)
        ```

**3. Create `vercel.json` file:**
*(Provide the content for the `vercel.json` file)*

**4. Dependency Cleanup:**
*(List the packages to be removed and provide the `npm uninstall` command)*

**[END PROMPT]**