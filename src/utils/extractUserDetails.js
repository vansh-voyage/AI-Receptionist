export function extractUserDetails(transcript) {
    let userName = null;
    let userEmail = null;
  
    // Regex to match email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    // Keywords to identify name
    const nameKeywords = ["my name is", "i am", "this is"];
  
    // Iterate through the transcript
    for (const entry of transcript) {
      const message = entry.message.toLowerCase();
  
      // Extract email
      const emailMatch = message.match(emailRegex);
      if (emailMatch) {
        userEmail = emailMatch[0];
      }
  
      // Extract name
      for (const keyword of nameKeywords) {
        if (message.includes(keyword)) {
          userName = message.split(keyword)[1].trim();
          break;
        }
      }
  
      // If both name and email are found, stop searching
      if (userName && userEmail) {
        break;
      }
    }
  
    return { userName, userEmail };
  }