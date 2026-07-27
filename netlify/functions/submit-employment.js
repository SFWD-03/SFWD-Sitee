// Netlify Serverless Function: submit-employment.js
// Creates items in the Monday.com "Job Applications" board (ID: 18423969019)
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const data = JSON.parse(event.body);
    const { firstName, lastName, phone, email, address, city, state, zip,
            position, experienceAreas, workHistory, skills, experienceDetail, additionalInfo } = data;
    if (!firstName || !lastName || !phone || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'First name, last name, phone, and email are required.' }) };
    }
    const fullName = firstName + ' ' + lastName;
    const cleanPhone = phone.replace(/\D/g, '');
    const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
    const notes = [experienceDetail, additionalInfo].filter(Boolean).join('\n\n');
    const columnValues = JSON.stringify({
      phone_mm5ncdea: { phone: cleanPhone, countryShortName: 'US' },
      email_mm5nmkgg: { email: email, text: email },
      text_mm5nerw6: position || '',
      text_mm5ndnw: fullAddress || '',
      text_mm5ngvrs: experienceAreas || '',
      long_text_mm5nddxd: { text: workHistory || '' },
      long_text_mm5n25mb: { text: skills || '' },
      long_text_mm5nmfkd: { text: notes || '' }
    });
    const mutation = `mutation { create_item(board_id: 18423969019, group_id: "topics", item_name: ${JSON.stringify(fullName)}, column_values: ${JSON.stringify(columnValues)}) { id name } }`;
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': process.env.MONDAY_API_TOKEN, 'API-Version': '2024-01' },
      body: JSON.stringify({ query: mutation })
    });
    const result = await response.json();
    if (result.errors) { return { statusCode: 500, body: JSON.stringify({ error: 'Monday.com API error', details: result.errors }) }; }
    return { statusCode: 200, body: JSON.stringify({ success: true, item_id: result.data?.create_item?.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
