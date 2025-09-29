You are an expert Next.js developer specializing in backend optimization and best practices.

I am refactoring my Next.js application to reduce the number of Serverless Functions for deployment on Vercel's Hobby plan, to pass the error "Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan". My current setup has multiple files for different HTTP methods for the same API endpoint, and I need to combine them into a single file.

Your task is to take the code from the separate files I provide and merge them into one consolidated API route. This new file must use a `switch` statement based on `req.method` to correctly route requests to the appropriate logic.

**Here is a clear example of the transformation I need:**

-----

**BEFORE:**
I have two separate files:

*File 1: `/pages/api/users/getAll.js`*

```javascript
// Handles GET requests
export default function handler(req, res) {
  const users = [{ id: 1, name: 'John Doe' }];
  res.status(200).json(users);
}
```

*File 2: `/pages/api/users/create.js`*

```javascript
// Handles POST requests
export default function handler(req, res) {
  const { name } = req.body;
  // Logic to create a new user...
  res.status(201).json({ id: 2, name: name });
}
```

**AFTER:**
I want a single, combined file:

*New File: `/pages/api/users.js`*

```javascript
// Handles multiple HTTP methods
export default function handler(req, res) {
  switch (req.method) {
    case 'GET':
      // Logic from getAll.js
      const users = [{ id: 1, name: 'John Doe' }];
      res.status(200).json(users);
      break;
    case 'POST':
      // Logic from create.js
      const { name } = req.body;
      // Logic to create a new user...
      res.status(201).json({ id: 2, name: name });
      break;
    default:
      // Handle any other HTTP method
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

-----

**Now, please perform this same refactoring on my actual files in "api" folder.**

Merge all necessary imports, consolidate the logic inside a `switch` statement, and include the default 405 error handler.