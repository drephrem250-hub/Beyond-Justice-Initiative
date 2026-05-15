exports.handler = async function(event, context) {
  // Handle preflight requests
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
        statusCode: 200, // Return 200 but with error message so frontend can show it
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in Netlify settings. Please check your environment variables." })
      };
    }

    const projectContext = `You are the Super Thinker AI for Beyond Justice Initiative in Rwanda. Task: ${task}.`;
    let promptText = "";

    if (task === 'analyze-legal') {
      promptText = `${projectContext} Analyze this legal text and return JSON with keys: summary, orderedSupport, legalStatus, gaps (array), recommendations (array). Text: ${text}`;
    } else if (task === 'field-insight') {
      promptText = `${projectContext} Analyze these case trends and return JSON with keys: trend, criticalGap, strategy (array), policyPoint. Data: ${JSON.stringify(caseData)}`;
    } else {
      promptText = `${projectContext} Draft a story from these notes. return JSON with keys: title, summary, body. Notes: ${text}`;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: "Google AI Error: " + data.error.message })
      };
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: aiResponse // The AI already returns a JSON string
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: "Function Error: " + err.message })
    };
  }
};
