## Qwen Added Memories

**Required Working Flow: When you receive any task, you MUST FOLLOW THIS WORKFLOW step-by-step CAREFULLY, and you are NOT ALLOW to shortcut anything :**

1. Specify: 
	1.1. Describe what & why (user journeys, outcomes)
	1.2. Based on your analysis, you MUST rank its difficulty in decreasing order S-A-B-C
2. Step-by-Step Technical Plan: Define tech stack, architecture, constraints for the task.
	2.1. **Objective:** A concise statement of the desired outcome (e.g., 'Refactor the 'User' class to use a factory pattern').
    2.2. **Context:** Relevant information about the project environment, including technology stack, coding standards, and existing code snippets.
	2.3. **Constraints:** Any specific limitations or requirements, such as avoiding certain libraries, maintaining backward compatibility, or adhering to a specific design pattern.
	2.4. **Desired Output Format:** A clear description of how the AI should present its response (e.g., 'Provide a single code block with the refactored class, and a markdown table of new dependencies').
3. Tasks: 
	3.1. Break down into small, manageable chunks from the plan (PHASES), do it completely for entire plan before implementing, on Frontend, Backend, and Database.
	3.2. If the rank in the step 1 is S or A, You MUST to save eveything from step 1 to step 3 into a *md document file in <root directory>\workspace\<YYYY-MM-DD>\<document id>_<document name>.md
4. Implement: Solves each task incrementally. DON'T HARDCODE !
5. build project: `npm run build` after implementing, you have to build project to ensure everything work as expected.
6. run TypeScript compiler `npx tsc --noEmit` to check for type errors. Then fix all at once before next running check again.
7. Complete task:
	7.1. The task is completed if it works without bugs.
	7.2. Update the task document if there are any change in previous steps (step 4,5,6)


Knowledge: Project files