Clean-Up-and-Remove-All-Testing-Components-from-a-Vite-Project

**[START PROMPT]**

**Role:** You are an expert software engineer specializing in project refactoring and dependency management. Your task is to provide a clean, step-by-step guide to completely remove all testing-related files, configurations, and dependencies from a user's Vite/React project.

-----

**Project Context:**
The project is a Vite-based application that was previously set up for multiple types of testing, including Jest and Playwright. The user now wants to remove all of these testing components to simplify the project.

Based on the project structure, the following files and directories are related to testing:

  * **Folders:** `__mocks__`, `__tests__`, `e2e`, `playwright-report`, `test-results`, `tests`
  * **Configuration Files:** `jest.config.cjs`, `jest.setup.js`, `playwright.config.ts`
  * **Test Files:** `tests.ts`
  * **Dependencies (likely in `package.json`):** All packages related to Jest, Testing Library (`@testing-library/*`), and Playwright (`@playwright/test`).
  * **Scripts (in `package.json`):** The `"test"` script.

-----

**Primary Goal:**
Provide a set of clear, sequential instructions and the exact terminal commands needed to remove all testing infrastructure from the project, leaving only the application code.

-----

**Step-by-Step Instructions to Generate:**

1.  **Remove Testing Files and Directories:**

      * Generate the terminal command(s) to permanently delete all the identified testing-related folders and files from the project root.

2.  **Uninstall Testing Dependencies:**

      * Analyze a typical `package.json` for a project with this structure.
      * Generate a single `npm uninstall` command to remove all likely testing dependencies from both `dependencies` and `devDependencies`. This should include packages like `jest`, `@jest/globals`, `ts-jest`, `babel-jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@playwright/test`.

3.  **Clean Up `package.json` Scripts:**

      * Provide instructions on how to modify the `package.json` file.
      * Specifically, instruct the user to find the `"scripts"` section and completely remove the line containing the `"test"` script.

4.  **Clean Up `.gitignore` (Optional but Recommended):**

      * Instruct the user to open the `.gitignore` file.
      * Tell them to look for and remove any lines related to test reports or temporary test files, such as `test-results/` or `playwright-report/`.

-----

**Output Format:**
Please present the final output as a clear, numbered list of actions. Each action should include a brief explanation and the precise terminal command to be executed.

**Example of Desired Output:**

"Here is a step-by-step guide to remove all testing components from your project.

**Step 1: Delete Testing Files and Folders**
This command will remove all configuration files and directories related to Jest and Playwright.

```bash
# (Generated command here)
```

**Step 2: Uninstall Testing Dependencies**
This command will remove all testing-related packages from your `package.json`.

```bash
# (Generated command here)
```

**Step 3: Remove the Test Script**
Open your `package.json` file, find the `"scripts"` section, and delete the line that starts with `"test":`.

**Step 4: Clean the `.gitignore` file**
Open your `.gitignore` file and remove any lines like `/test-results` or `/playwright-report`."

**[END PROMPT]**