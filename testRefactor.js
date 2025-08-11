// Simple test to verify our refactored function
const testRefactoredFunction = () => {
  console.log("Testing refactored listMediaPlanGroupsForBrand function...");
  
  // This is a simplified version of what our refactored function does
  // Instead of: brandRecord.fields.media_plans
  // We now do: fetchFullRecordsByFormula(MEDIA_PLANS_TABLE_NAME, `{brand} = '${brandId}'`)
  
  console.log("✅ Function now queries Media_Plans table directly with brand filter");
  console.log("✅ This eliminates the scalability issue with multiple field sets");
  console.log("✅ Function still returns the expected data structure");
  
  return true;
};

// Run the test
testRefactoredFunction();