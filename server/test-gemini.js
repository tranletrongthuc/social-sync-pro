require('dotenv').config();

// 1. Ensure the import is exactly like this
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Load your API key from an environment variable
const apiKey = process.env.GEMINI_API_KEY;

// Check if the API key is loaded. If not, the script will exit.
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1);
}

try {
  // 3. Initialize the client
  console.log("Initializing GoogleGenerativeAI client...");
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log("Client initialized successfully.");

  // 4. Get the model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
  console.log("Model retrieved successfully. You are ready to go!");

} catch (error) {
  console.error("An error occurred during setup:", error);
}