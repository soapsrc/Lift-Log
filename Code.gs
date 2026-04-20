function onEdit(e) {
  try {
    Logger.log("=== onEdit triggered ===");
    Logger.log("Sheet: " + e.source.getActiveSheet().getName());
    Logger.log("Row: " + e.range.getRow() + " | Col: " + e.range.getColumn());
    Logger.log("Old value: " + e.oldValue + " | New value: " + e.value);

    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== "Exercises") {
      Logger.log("SKIP: Not the Exercises sheet.");
      return;
    }

    const row = e.range.getRow();
    const col = e.range.getColumn();

    if (row < 4) {
      Logger.log("SKIP: Row " + row + " is above data rows (min row 4).");
      return;
    }

    // Col 1=✔︎, Col 2=Exercise, Col 3=Category, Col 4=Target, Col 5=Sets, Col 6=Reps, Col 7=Weight, Col 8=Last Done

    // --- TRUE -> FALSE: delete log ---
    if (col === 1 && String(e.value).toLowerCase() === "false" && String(e.oldValue).toLowerCase() === "true") {
      Logger.log("Checkbox unchecked — attempting to delete log entry.");
      const exerciseName = sheet.getRange(row, 2).getValue();
      const lastDone = sheet.getRange(row, 8).getValue();
      Logger.log("Exercise name raw: '" + exerciseName + "'");
      Logger.log("Last Done raw value: '" + lastDone + "' | type: " + typeof lastDone);
      // Normalize to string in case it's stored as a Date object
      const lastDoneStr = lastDone instanceof Date ? formatDate(lastDone) : String(lastDone);
      Logger.log("Last Done normalized: '" + lastDoneStr + "'");
      deleteFromLogsSheet(e.source, lastDoneStr, exerciseName);
      return;
    }

    // --- FALSE -> TRUE: write date + log ---
    if (col === 1 && String(e.oldValue).toLowerCase() === "false" && String(e.value).toLowerCase() === "true") {
      Logger.log("MATCH: Checkbox turned TRUE at row " + row);
      const today = new Date();
      const formatted = formatDate(today);
      Logger.log("Writing date to col 8: " + formatted);
      sheet.getRange(row, 8).setValue(formatted);

      const exerciseName = sheet.getRange(row, 2).getValue();
      const sets = sheet.getRange(row, 5).getValue();
      const reps = sheet.getRange(row, 6).getDisplayValue();
      const weight = sheet.getRange(row, 7).getValue();
      Logger.log("Exercise: '" + exerciseName + "' | Sets: '" + sets + "' | Reps: '" + reps + "' | Weight: '" + weight + "'");

      if (reps === "" || reps === null || weight === "" || weight === null) {
        Logger.log("SKIP logging: Reps or Weight is empty.");
        return;
      }
      logToLogsSheet(e.source, formatted, exerciseName, weight, reps, sets);
      return;
    }

    // --- Sets (col 5), Reps (col 6) or Weight (col 7) edited ---
    if (col === 5 || col === 6 || col === 7) {
      const checkboxValue = sheet.getRange(row, 1).getValue();
      Logger.log("Weight/Reps edited. Checkbox value: '" + checkboxValue + "' | type: " + typeof checkboxValue);

      if (String(checkboxValue).toLowerCase() !== "true") {
        Logger.log("SKIP: Checkbox is not TRUE.");
        return;
      }

      const exerciseName = sheet.getRange(row, 2).getValue();
      const sets = sheet.getRange(row, 5).getValue();
      const reps = sheet.getRange(row, 6).getDisplayValue();
      const weight = sheet.getRange(row, 7).getValue();
      const lastDoneRaw = sheet.getRange(row, 8).getValue();

      Logger.log("Exercise: '" + exerciseName + "' | Sets: '" + sets + "' | Reps: '" + reps + "' | Weight: '" + weight + "'");
      Logger.log("Last Done raw: '" + lastDoneRaw + "' | type: " + typeof lastDoneRaw);

      const lastDone = lastDoneRaw instanceof Date ? formatDate(lastDoneRaw) : String(lastDoneRaw);
      Logger.log("Last Done normalized: '" + lastDone + "'");

      if (!lastDone || reps === "" || reps === null || weight === "" || weight === null) {
        Logger.log("SKIP: Missing date, reps, or weight.");
        return;
      }

      logToLogsSheet(e.source, lastDone, exerciseName, weight, reps, sets);
      return;
    }

    Logger.log("SKIP: Column " + col + " not watched.");

  } catch (err) {
    Logger.log("ERROR in onEdit: " + err.message);
    Logger.log(err.stack);
  }
}

function formatDate(date) {
  const days   = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayName = days[date.getDay()];
  const month   = months[date.getMonth()];
  const day     = date.getDate();
  const year    = date.getFullYear();
  return `${dayName}, ${month}. ${day}, ${year}`;
}

function logToLogsSheet(spreadsheet, date, exName, exWeight, exReps, exSets) {
  try {
    Logger.log("=== logToLogsSheet called ===");
    Logger.log("Date: '" + date + "' | Exercise: '" + exName + "' | Weight: '" + exWeight + "' | Reps: '" + exReps + "' | Sets: '" + exSets + "'");

    const logsSheet = spreadsheet.getSheetByName("Logs");
    if (!logsSheet) {
      Logger.log("ERROR: Sheet 'Logs' not found. Available: " + spreadsheet.getSheets().map(s => s.getName()).join(", "));
      return;
    }

    const lastRow = logsSheet.getLastRow();
    Logger.log("Last row in Logs: " + lastRow);

    let targetRow = -1;
    if (lastRow >= 2) {
      const existingData = logsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (let i = 0; i < existingData.length; i++) {
        const rowDateRaw = existingData[i][0];
        const rowName    = existingData[i][1];
        const rowDate    = rowDateRaw instanceof Date ? formatDate(rowDateRaw) : String(rowDateRaw);
        Logger.log("Row " + (i+2) + ": date='" + rowDate + "' name='" + rowName + "'");
        Logger.log("  Comparing date: '" + rowDate + "' === '" + date + "' -> " + (rowDate === date));
        Logger.log("  Comparing name: '" + rowName + "' === '" + exName + "' -> " + (rowName === exName));
        if (rowDate === date && rowName === exName) {
          targetRow = i + 2;
          Logger.log("Match found at row " + targetRow);
          break;
        }
      }
    }

    if (targetRow !== -1) {
      logsSheet.getRange(targetRow, 3).setValue(exWeight);
      logsSheet.getRange(targetRow, 4).setNumberFormat("@").setValue(exReps.toString());
      if (exSets !== undefined && exSets !== "") logsSheet.getRange(targetRow, 5).setValue(exSets);
      Logger.log("Updated existing row " + targetRow);
    } else {
      targetRow = lastRow + 1;
      Logger.log("No match — appending new row at " + targetRow);
      logsSheet.getRange(targetRow, 1).setValue(date);
      logsSheet.getRange(targetRow, 2).setValue(exName);
      logsSheet.getRange(targetRow, 3).setValue(exWeight);
      logsSheet.getRange(targetRow, 4).setNumberFormat("@").setValue(exReps.toString());
      if (exSets !== undefined && exSets !== "") logsSheet.getRange(targetRow, 5).setValue(exSets);
      Logger.log("New row written.");
    }

  } catch (err) {
    Logger.log("ERROR in logToLogsSheet: " + err.message);
    Logger.log(err.stack);
  }
}

function deleteFromLogsSheet(spreadsheet, date, exName) {
  try {
    Logger.log("=== deleteFromLogsSheet called ===");
    Logger.log("Looking for date: '" + date + "' | exercise: '" + exName + "'");

    const logsSheet = spreadsheet.getSheetByName("Logs");
    if (!logsSheet) {
      Logger.log("ERROR: Sheet 'Logs' not found.");
      return;
    }

    const lastRow = logsSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log("No data rows in Logs.");
      return;
    }

    const existingData = logsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = existingData.length - 1; i >= 0; i--) {
      const rowDateRaw = existingData[i][0];
      const rowName    = existingData[i][1];
      const rowDate    = rowDateRaw instanceof Date ? formatDate(rowDateRaw) : String(rowDateRaw);
      Logger.log("Row " + (i+2) + ": date='" + rowDate + "' name='" + rowName + "'");
      Logger.log("  Comparing date: '" + rowDate + "' === '" + date + "' -> " + (rowDate === date));
      Logger.log("  Comparing name: '" + rowName + "' === '" + exName + "' -> " + (rowName === exName));
      if (rowDate === date && rowName === exName) {
        logsSheet.deleteRow(i + 2);
        Logger.log("Deleted row " + (i + 2));
        return;
      }
    }

    Logger.log("No matching log entry found to delete.");

  } catch (err) {
    Logger.log("ERROR in deleteFromLogsSheet: " + err.message);
    Logger.log(err.stack);
  }
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === "history") {
    const logsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");
    const lastRow = logsSheet.getLastRow();
    if (lastRow < 4) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const data = logsSheet.getRange(4, 1, lastRow - 3, 5).getValues();
    const logs = data
    .filter(r => r[0] !== "")
    .map((r, i) => ({ rowId: i + 4, date: r[0], exercise: r[1], weight: r[2], reps: r[3], sets: r[4] }));
    return ContentService.createTextOutput(JSON.stringify(logs))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: return exercises with category + muscle group
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Exercises");
  const data = sheet.getRange(4, 2, sheet.getLastRow() - 3, 3).getValues();
  const exercises = data
    .filter(r => r[0] !== "")
    .map(r => ({ name: r[0], category: r[1], muscleGroup: r[2] }));
  return ContentService.createTextOutput(JSON.stringify(exercises))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName("Logs");
  const exercisesSheet = ss.getSheetByName("Exercises");

  // ── Add exercise ──────────────────────────────────────────
  if (payload.action === 'addExercise') {
    const lastRow = exercisesSheet.getLastRow();
    exercisesSheet.getRange(lastRow + 1, 2, 1, 3).setValues([[
      payload.name, payload.category, payload.muscleGroup
    ]]);
    return jsonResponse({ success: true });
  }

  // ── Edit log row ──────────────────────────────────────────
  if (payload.action === 'editLog') {
    const row = Number(payload.rowId);
    logsSheet.getRange(row, 3).setValue(payload.weight);
    logsSheet.getRange(row, 4).setNumberFormat("@").setValue(payload.reps.toString());
    if (payload.sets !== undefined && payload.sets !== "") logsSheet.getRange(row, 5).setValue(payload.sets);
    return jsonResponse({ success: true });
  }

  // ── Delete log row ────────────────────────────────────────
  if (payload.action === 'deleteLog') {
    logsSheet.deleteRow(Number(payload.rowId));
    return jsonResponse({ success: true });
  }

  // ── Default: log exercise ─────────────────────────────────
  const lastRow = logsSheet.getLastRow();
  const newRow = lastRow + 1;
  logsSheet.getRange(newRow, 1).setValue(payload.date);
  logsSheet.getRange(newRow, 2).setValue(payload.exercise);
  logsSheet.getRange(newRow, 3).setValue(payload.weight);
  logsSheet.getRange(newRow, 4).setNumberFormat("@").setValue(payload.reps.toString());
  if (payload.sets !== undefined && payload.sets !== "") logsSheet.getRange(newRow, 5).setValue(payload.sets);

  // Update Last Done + checkbox in Exercises sheet
  const exData = exercisesSheet.getRange(4, 2, exercisesSheet.getLastRow() - 3, 7).getValues();
  for (let i = 0; i < exData.length; i++) {
    if (exData[i][0] === payload.exercise) {
      exercisesSheet.getRange(i + 4, 8).setValue(payload.date);
      exercisesSheet.getRange(i + 4, 1).setValue(true);
      break;
    }
  }

  return jsonResponse({ success: true });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}