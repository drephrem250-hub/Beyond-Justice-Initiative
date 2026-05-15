exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { task, text, caseData } = JSON.parse(event.body);
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server missing API key configuration." })
      };
    }

    let promptText = "";

    // SYSTEM CONTEXT FROM PROJECT DOCUMENT
    const projectContext = `
      You are the "Super Thinker" AI for the Beyond Justice Initiative (BJI) / Rinda Umwana in Huye, Rwanda.
      Your goal is to ensure justice continues after court rulings.
      Core Pillars: Legal Navigation, Economic Reintegration, Community Stigma Reduction, Prevention.
      Core Logic: Compare "Ordered Support" vs "Received Support" to identify "Justice Gaps".
    `;

    if (task === 'analyze-legal') {
      promptText = `${projectContext}
        TASK: Analyze the following legal text (court ruling, case summary, or article).
        1. Extract: Ordered Child Support (amount/type), Support Frequency, Father's Status, Legal Sanctions.
        2. Identify: Possible Follow-up Mechanisms mentioned.
        3. Flag: Potential institutional coordination gaps (e.g., between Justice and Health).
        
        OUTPUT: Return a JSON object with:
        "summary": "Brief overview",
        "orderedSupport": "Details of what was ordered",
        "legalStatus": "Current legal standing",
        "gaps": ["List of identified gaps"],
        "recommendations": ["Actionable next steps"]
        
        TEXT TO ANALYZE:
        ${text}`;
    } else if (task === 'field-insight') {
      promptText = `${projectContext}
        TASK: Analyze field data trends.
        Current Case Data Summary: ${JSON.stringify(caseData)}
        Identify the most significant gaps (e.g., which sector has the highest justice gap) and provide strategic recommendations for the GLF Execution Team.
        
        OUTPUT: Return a JSON object with:
        "trend": "The primary trend identified",
        "criticalGap": "The most urgent issue",
        "strategy": ["3-4 strategic steps"],
        "policyPoint": "One specific point for a policy brief"`;
    } else {
      // Default to the original story drafting task
      promptText = `${projectContext}
        TASK: Draft an empathetic, fully anonymized advocacy story.
        Remove all real names, specific villages, and dates. Use "A 17-year-old mother in Huye" etc.
        
        OUTPUT: Return a JSON object with:
        "title": "Impactful title",
        "summary": "1-2 sentence summary",
        "body": "Compelling narrative story"
        
        NOTES:
        ${text}`;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "API Error");

    const aiText = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(aiText);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
