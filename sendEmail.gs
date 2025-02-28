function myQuotaFunction() {
  Logger.log("Remaining email quota: " + MailApp.getRemainingDailyQuota());
}

function getIDFolder(){
  var folders = DriveApp.getFoldersByName("Contancias_por_estudiante")
  while (folders.hasNext()){
    var folder = folders.next();
    Logger.log("ID: " + folder.getId() + " Parents: " + folder.getParents().next());
  }
  
}

function myEmailDraft() {
  const html = HtmlService.createTemplateFromFile("templete").evaluate().getContent();
  var draft = GmailApp.createDraft("","Constancia de participacion en el Congreso CETI 2022","",{htmlBody:html});
}

const RECIPIENT_COL  = "Recipient";
const EMAIL_SENT_COL = "Email Sent";
const ATTACHMNET_COL = "Attachment";

function mailMerge(subjectLine="Constancia de participacion en el Congreso CETI 2022", sheet=SpreadsheetApp.getActiveSheet()){
  if (subjectLine === "cancel" || subjectLine == ""){ 
    // If no subject line, finishes up
    return;
    }
  // Gets the draft Gmail message to use as a template
  const emailTemplate = getGmailTemplateFromDrafts_(subjectLine);  
  // Gets the data from the passed sheet
  const dataRange = sheet.getDataRange();
  const data = dataRange.getDisplayValues();

  // Assumes row 1 contains our column headings
  const heads = data.shift(); 
  // Gets the index of the column named 'Email Status' (Assumes header names are unique)
  // @see http://ramblings.mcpher.com/Home/excelquirks/gooscript/arrayfunctions
  const emailSentColIdx = heads.indexOf(EMAIL_SENT_COL);
  
  // Converts 2d array into an object array
  // See https://stackoverflow.com/a/22917499/1027723
  // For a pretty version, see https://mashe.hawksey.info/?p=17869/#comment-184945
  const obj = data.map(r => (heads.reduce((o, k, i) => (o[k] = r[i] || '', o), {})));

  var folder = DriveApp.getFolderById("1BwWUB-6C_7wD8AskbM6gp1Fsp0e9FtL7");

  // Creates an array to record sent emails
  const out = [];

  // Loops through all the rows of data
  obj.forEach(function(row, rowIdx){
    // Only sends emails if email_sent cell is blank and not hidden by a filter
    if (row[EMAIL_SENT_COL] == ''){
      try {
        const msgObj = fillInTemplateFromObject_(emailTemplate.message, row);

        // See https://developers.google.com/apps-script/reference/gmail/gmail-app#sendEmail(String,String,String,Object)
        // If you need to send emails with unicode/emoji characters change GmailApp for MailApp
        // Uncomment advanced parameters as needed (see docs for limitations)
        GmailApp.sendEmail(row[RECIPIENT_COL],msgObj.subject,msgObj.text,{
          htmlBody: msgObj.html,
          // bcc: 'a.bcc@email.com',
          // cc: 'a.cc@email.com',
          // from: 'an.alias@email.com',
          name: 'Josue - Congreso Virtual CETI',
          replyTo: 'hmgomez@ceti.mx',
          // noReply: true, // if the email should be sent from a generic no-reply email address (not available to gmail.com users)
          attachments: [folder.getFilesByName(row[ATTACHMNET_COL]).next().getAs(MimeType.PDF)],
          inlineImages: emailTemplate.inlineImages
        });
        // Edits cell to record email sent date
        out.push([new Date()]);
      } catch(e) {
        // modify cell to record error
        out.push([e.message]);
      }
    } else {
      out.push([row[EMAIL_SENT_COL]]);
    }
  });

  // Updates the sheet with new data
  sheet.getRange(2, emailSentColIdx+1, out.length).setValues(out);

}

function getGmailTemplateFromDrafts_(subject_line){
    try {
      // get drafts
      const drafts = GmailApp.getDrafts();
      // filter the drafts that match subject line
      const draft = drafts.filter(subjectFilter_(subject_line))[0];
      // get the message object
      const msg = draft.getMessage();

      // Handles inline images and attachments so they can be included in the merge
      // Based on https://stackoverflow.com/a/65813881/1027723
      // Gets all attachments and inline image attachments
      const allInlineImages = draft.getMessage().getAttachments({includeInlineImages: true,includeAttachments:false});
      const attachments = draft.getMessage().getAttachments({includeInlineImages: false});
      const htmlBody = msg.getBody(); 

      // Creates an inline image object with the image name as key 
      // (can't rely on image index as array based on insert order)
      const img_obj = allInlineImages.reduce((obj, i) => (obj[i.getName()] = i, obj) ,{});

      //Regexp searches for all img string positions with cid
      const imgexp = RegExp('<img.*?src="cid:(.*?)".*?alt="(.*?)"[^\>]+>', 'g');
      const matches = [...htmlBody.matchAll(imgexp)];

      //Initiates the allInlineImages object
      const inlineImagesObj = {};
      // built an inlineImagesObj from inline image matches
      matches.forEach(match => inlineImagesObj[match[1]] = img_obj[match[2]]);

      return {message: {subject: subject_line, text: msg.getPlainBody(), html:htmlBody}, 
              attachments: attachments, inlineImages: inlineImagesObj };
    } catch(e) {
      throw new Error("Oops - can't find Gmail draft");
    }

    /**
     * Filter draft objects with the matching subject linemessage by matching the subject line.
     * @param {string} subject_line to search for draft message
     * @return {object} GmailDraft object
    */
    function subjectFilter_(subject_line){
      return function(element) {
        if (element.getMessage().getSubject() === subject_line) {
          return element;
        }
      }
    }
    
  }

  function fillInTemplateFromObject_(template, data) {
    // We have two templates one for plain text and the html body
    // Stringifing the object means we can do a global replace
    let template_string = JSON.stringify(template);

    // Token replacement
    template_string = template_string.replace(/{{[^{}]+}}/g, key => {
      return escapeData_(data[key.replace(/[{}]+/g, "")] || "");
    });
    return  JSON.parse(template_string);
  }

  function escapeData_(str) {
    return str
      .replace(/[\\]/g, '\\\\')
      .replace(/[\"]/g, '\\\"')
      .replace(/[\/]/g, '\\/')
      .replace(/[\b]/g, '\\b')
      .replace(/[\f]/g, '\\f')
      .replace(/[\n]/g, '\\n')
      .replace(/[\r]/g, '\\r')
      .replace(/[\t]/g, '\\t');
    };
  };