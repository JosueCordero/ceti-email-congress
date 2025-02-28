function separateNames() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var firstNameColumn = [];
  var lastNameColumn = [];

  for (var i = 1; i < data.length; i++) {
    var fullName = data[i][1]; // Assuming the names are in the first column

    // Split the full name into an array of names
    var names = fullName.split(/\s+/);

    if (names.length >= 2) {
      // If there are at least two names, consider the first part as the first name
      var firstName = names[0];
      // Combine the rest of the names as the last name
      var lastName = names.slice(1).join(" ");
    } else {
      // If there's only one name, consider it as the first name, and leave last name empty
      var firstName = names[0];
      var lastName = "";
    }

    firstNameColumn.push([firstName]);
    lastNameColumn.push([lastName]);
  }

  // Write the separated names back to the sheet
  sheet.getRange(2, 3, firstNameColumn.length, 1).setValues(firstNameColumn); // Assuming the first name column is the second column
  sheet.getRange(2, 4, lastNameColumn.length, 1).setValues(lastNameColumn); // Assuming the last name column is the third column
}

function normalizeNames() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var name = data[i][2]; // Assuming the names are in the first column

    // Normalize the name by converting the first letter to uppercase and the rest to lowercase
    var normalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    // Update the name in the sheet
    sheet.getRange(i + 1, 3).setValue(normalizedName); // Assuming the names are in the first column
  }
}

function extractTextFromPDF() {
  var fileId = '1emL1edFOkCQu8qU8gM93voySTl7_zku3'; // Replace with the actual file ID of your PDF
  var pdfFile = DriveApp.getFileById(fileId);
  
  if (pdfFile.getMimeType() === 'application/pdf') {
    var pdfText = pdfFile.getBlob().getDataAsString();
    Logger.log(pdfText); // You can log the text or process it further
  } else {
    Logger.log('The file is not a PDF.');
  }
}

function getInfoAllnamed(){
  var files = DriveApp.getFilesByName('constancias_1-1.pdf');

  while (files.hasNext()){
    var file = files.next();
    Logger.log("Nombre: " + file.getName() +" ID: " + file.getId());
    Logger.log("Carpeta padre: " + file.getParents().next());

    }
}

/*
 * Convert PDF file to text
 * @param {string} fileId - The Google Drive ID of the PDF
 * @param {string} language - The language of the PDF text to use for OCR
 * return {string} - The extracted text of the PDF file
 */

const convertPDFToText = (fileId="1emL1edFOkCQu8qU8gM93voySTl7_zku3", language) => {

  language = language || 'en'; // English

  // Read the PDF file in Google Drive
  const pdfDocument = DriveApp.getFileById(fileId);

  // Use OCR to convert PDF to a temporary Google Document
  // Restrict the response to include file Id and Title fields only
  const { id, title } = Drive.Files.insert(
    {
      title: pdfDocument.getName().replace(/\.pdf$/, ''),
      mimeType: pdfDocument.getMimeType() || 'application/pdf',
    },
    pdfDocument.getBlob(),
    {
      ocr: true,
      ocrLanguage: language,
      fields: 'id,title',
    }
  );

  // Use the Document API to extract text from the Google Document
  const textContent = DocumentApp.openById(id).getBody().getText();

  // Delete the temporary Google Document since it is no longer needed
  DriveApp.getFileById(id).setTrashed(true);
  Logger.log(textContent)
  // (optional) Save the text content to another text file in Google Drive
  //const textFile = DriveApp.createFile(`${title}.txt`, textContent, 'text/plain');
  //return textContent;
};

function generateFileNames() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var fileNames = [];
  
  for (var i = 1; i <= 300; i++) {
    var newFileName = "constancias_" + i + "-" + i + ".pdf";
    fileNames.push([newFileName]);
  }
  
  sheet.getRange(2, 5, fileNames.length, 1).setValues(fileNames);
}

function setHashID(){
  var sheet = SpreadsheetApp.getActiveSheet();
   var data = sheet.getDataRange().getValues();

  var finalvalues = [];
  for (var i = 1; i < data.length; i++) {
    var email = data[i][2]; 

    var hashID = getMD5Hash(email);
    finalvalues.push([hashID]);
  }

  sheet.getRange(2,1,finalvalues.length,1).setValues(finalvalues);
}



function getMD5Hash(value) {
  value = value + generateRandomString(8) // added this
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,
                                         value,
                                         Utilities.Charset.UTF_8)
  let hash = ''
  for (i = 0; i < digest.length; i++) {
    let byte = digest[i]
    if (byte < 0) byte += 256
    let bStr = byte.toString(16)
    if (bStr.length == 1) bStr = '0' + bStr
    hash += bStr
  }
  return hash
}

function generateRandomString(length) {
  const randomNumber = Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)
  const randomString = Math.round(randomNumber).toString(36).slice(1)
  return randomString
}