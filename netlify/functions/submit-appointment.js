// Netlify Serverless Function: submit-appointment.js
// Creates items in Monday.com "Request An Appointment" board (ID: 4546344839)
// Env var required in Netlify: MONDAY_API_TOKEN

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const data = JSON.parse(event.body);
    const { name, phone, email, zip, service, financing, message } = data;
    if (!name || !phone || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name, phone, and email are required.' }) };
    }
    const notesParts = [];
    if (service)   notesParts.push('Service Interest: ' + service);
    if (financing) notesParts.push('Financing: ' + financing);
    if (zip)       notesParts.push('ZIP: ' + zip);
    if (message)   notesParts.push('\nMessage:\n' + message);
    const notes = notesParts.join('\n');
    const cleanPhone = phone.replace(/\D/g, '');
    const columnValues = JSON.stringify({
      phone7: { phone: cleanPhone, countryShortName: 'US' },
      email:  { email: email, text: email },
      text_1: notes,
      label1: { label: 'Website' },
      status: { label: 'NEW' }
    });
    const mutation = 'mutation { create_item(board_id: 4546344839, group_id: "duplicate_of_new_calls38643", item_name: ' + JSON.stringify(name) + ', column_values: ' + JSON.stringify(columnValues) + ') { id name } }';
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_API_TOKEN,
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query: mutation })
    });
    const result = await response.json();
    if (result.errors) {
      console.error('Monday API error:', JSON.stringify(result.errors));
      return { statusCode: 500, body: JSON.stringify({ error: 'Monday.com API error', details: result.errors }) };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true, item_id: result.data && result.data.create_item && result.data.create_item.id }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
