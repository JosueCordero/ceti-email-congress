function doGet(e) {
  const email = e.parameter['email']
  const unsubscribeHash = e.parameter['unsubscribe_hash']
  const success = unsubscribeUser(email, unsubscribeHash)
  if (success) {
    return ContentService.createTextOutput().append('You have unsubscribed')
  }
  return ContentService.createTextOutput().append('Failed')
}

function unsubscribeUser(emailToUnsubscribe, unsubscribeHash) {  
  // get the active sheet which contains your emails
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('database')

  // get the data in it
  const data = sheet.getDataRange().getValues()
  
  // get sheet headers i.e. top row of the sheet
  const headers = data[0]

  // get the index for each header
  const emailIndex = headers.indexOf('Recipient')
  const unsubscribeHashIndex = headers.indexOf('HashID')
  const subscribedIndex = headers.indexOf('Subscribed')
  
  // iterate through the data, starting at index 1
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = row[unsubscribeHashIndex];

    // if the email and unsubscribe hash match with the values in the sheet
    // then update the subscribed value to 'no'
    if (emailToUnsubscribe === email && unsubscribeHash === hash) {
      sheet.getRange(i+1, subscribedIndex+1).setValue('no')
      return true;
    }
  }
}