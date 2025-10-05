document.getElementById('schedule-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const statusMessage = document.getElementById('status-message');
  const dataOutput = document.getElementById('data-output');
  const fileInput = document.getElementById('schedule-file');
  
  statusMessage.textContent = 'Starting client-side processing...';
  statusMessage.className = '';
  dataOutput.textContent = 'Converting file to CSV text...';

  const file = fileInput.files[0];
  if (!file) {
      statusMessage.textContent = 'Please select a file.';
      statusMessage.className = 'error';
      return;
  }

  // --- STEP 1: Client-Side XLSX/CSV Conversion using SheetJS ---
  const reader = new FileReader();

  reader.onload = async function(event) {
      try {
          const data = new Uint8Array(event.target.result);
          
          // Step 1: Read the entire workbook structure
          const workbook = XLSX.read(data, { 
              type: 'array',
              cellDates: true, 
              raw: true, 
              cellFormula: false,
              range: 0 // Read entire sheet to determine boundaries
          });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // CRITICAL FIX START: Define the explicit range for conversion
          
          // Step 2: Define the header row index (Row 3 = index 2)
          const startRowIndex = 2; 
          
          // Get the current sheet range (e.g., A1:Z1000)
          const sheetRange = XLSX.utils.decode_range(worksheet['!ref'] || "A1:Z1000");
          
          // Create a new range object that starts at Row 3 (index 2)
          const newRange = { 
              s: { r: startRowIndex, c: sheetRange.s.c }, // Start at row 3 (index 2), column 0
              e: sheetRange.e // End at the original sheet end
          };

          // Encode the new range back to A3:Z1000 format
          const newRangeAddress = XLSX.utils.encode_range(newRange);
          
          // CRITICAL FIX END: The conversion will now only process A3 and below

          // Step 3: Convert the sheet to CSV, using the new, explicit range.
          const csvText = XLSX.utils.sheet_to_csv(worksheet, {
              FS: ',', 
              RS: '\n', 
              forceQuotes: true,
              range: newRangeAddress, // <-- USES THE NEW RANGE
              header: 1, 
              blankrows: true 
          });
          
          // Quick check for lines before sending (should now be > 1)
          const lineCount = (csvText.match(/\n/g) || []).length + 1;
          console.log(`[Client] Generated CSV text successfully. Lines found: ${lineCount}`);
          
          if (lineCount < 2) {
               statusMessage.textContent = `FATAL ERROR: SheetJS generated only ${lineCount} lines. The file may only contain the header row and no data.`;
               statusMessage.className = 'error';
               return; 
          }
          
          // --- STEP 4: Send the Clean CSV Text to Python Backend ---
          
          statusMessage.textContent = 'Sending explicit-range CSV text to Python server...';

          const formData = new FormData();
          formData.append('schedule_text', csvText); 

          const response = await fetch('http://127.0.0.1:5000/upload-schedule', {
              method: 'POST',
              body: formData 
          });

          const result = await response.json();

          if (response.ok) {
              const cleanedData = JSON.parse(result.data);
              
              statusMessage.textContent = `SUCCESS! Found ${result.count} relevant rows. Data is clean.`;
              statusMessage.className = 'success';
              
              dataOutput.textContent = JSON.stringify(cleanedData, null, 2);

          } else {
              statusMessage.textContent = `SERVER ERROR (400): ${result.error || 'Unknown server error.'}`;
              statusMessage.className = 'error';
              dataOutput.textContent = JSON.stringify(result, null, 2);
          }

      } catch (error) {
          statusMessage.textContent = `FATAL CLIENT-SIDE READ ERROR: Failed to process file. Check console (F12) for details.`;
          statusMessage.className = 'error';
          dataOutput.textContent = error.message;
          console.error("Client side error during file read:", error);
      }
  };

  reader.readAsArrayBuffer(file);
});