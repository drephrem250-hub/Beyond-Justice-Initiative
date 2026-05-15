exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { task, text, caseData } = JSON.parse(event.body);
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY." })
      };
    }

    const projectContext = "You are the Super Thinker AI. Return response as a JSON object.";
    let promptText = "";

    if (task === 'analyze-legal') {
      promptText = `${projectContext} Analyze legal text and return JSON (summary, orderedSupport, legalStatus, gaps, recommendations). TEXT: ${text}`;
    } else if (task === 'field-insight') {
      promptText = `${projectContext} Analyze case trends and return JSON (trend, criticalGap, strategy, policyPoint). DATA: ${JSON.stringify(caseData)}`;
    } else {
      promptText = `${projectContext} Draft story and return JSON (title, summary, body). NOTES: ${text}`;
    }

    // RESTORING THE ORIGINAL URL STRUCTURE FROM YOUR WORKING CODE
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: "API Error: " + data.error.message })
      };
    }

    let aiResponse = data.candidates[0].content.parts[0].text;
    aiResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: aiResponse
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: "System Error: " + err.message })
    };
  }
};
