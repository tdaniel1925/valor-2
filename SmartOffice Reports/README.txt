================================================================================
  SmartOffice Automatic Import - HOW TO USE
================================================================================

SIMPLE WORKFLOW:

1. PUT YOUR SPREADSHEETS HERE
   - Drag your latest Excel or CSV files into this "SmartOffice Reports" folder
   - Files can be named anything (e.g., "Policies Feb 2026.xlsx" or "Agents.csv")
   - Both policies and agents spreadsheets go here
   - Supports: .xlsx, .xls, and .csv formats

2. RUN THE UPDATE
   - Double-click "Update SmartOffice Data.bat" in the main folder
   - OR run: npx tsx scripts/auto-import-smartoffice.ts

3. THAT'S IT!
   - The system automatically:
     ✓ Finds all Excel files in this folder
     ✓ Detects if they're policies or agents
     ✓ Deletes old data
     ✓ Imports new data
     ✓ Updates the dashboard

SMART FEATURES:

✓ Only imports files that have changed since last import
✓ Automatically replaces ALL old data with new data
✓ No duplicates created
✓ Dashboard shows current data immediately

TIPS:

- You can update spreadsheets every day, hour, or whenever
- Just replace the files and run the update
- The system knows if a file changed and only imports what's new
- Keep old files or delete them - doesn't matter, system only looks at Excel files

CURRENT FILES:

The system will import ANY .xlsx, .xls, or .csv file it finds here.
Name them whatever you want!

================================================================================
