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
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in Netlify settings." })
      };
    }

    const projectContext = "You are the Super Thinker AI for Beyond Justice Initiative. Return your response ONLY as a raw JSON object.";
    let promptText = "";

    if (task === 'analyze-legal') {
      promptText = `${projectContext} TASK: Analyze this legal text. Return JSON with keys: "summary", "orderedSupport", "legalStatus", "gaps" (array), "recommendations" (array). TEXT: ${text}`;
    } else if (task === 'field-insight') {
      promptText = `${projectContext} TASK: Analyze these case trends. Return JSON with keys: "trend", "criticalGap", "strategy" (array), "policyPoint". DATA: ${JSON.stringify(caseData)}`;
    } else {
      promptText = `${projectContext} TASK: Draft an anonymized advocacy story. Return JSON with keys: "title", "summary", "body". NOTES: ${text}`;
    }

    // Using v1/gemini-pro for maximum compatibility across all accounts/regions
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + key, {
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
        body: JSON.stringify({ error: "Google Error: " + data.error.message })
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
