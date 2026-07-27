// Netlify Serverless Function: submit-appointment.js
// Creates items in the Monday.com "Website Form Submissions" board (ID: 18423966879)
//
// Required environment variable in Netlify:
//   MONDAY_API_TOKEN  -- your Monday.com API v2 token

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, phone, email, zip, service, financing, message } = data;

    if (!name || !phone || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name, phone, and email are required.' })
      };
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const columnValues = JSON.stringify({
      phone_mm5npava:     { phone: cleanPhone, countryShortName: 'US' },
      email_mm5nxjdw:     { email: email, text: email },
      text_mm5nx4aj:      service   || '',
      text_mm5ne5cy:      financing || '',
      text_mm5nf7cj:      zip       || '',
      long_text_mm5nzxkg: { text: message || '' }
    });

    const mutation = 'mutation { create_item(board_id: 18423966879, group_id: "topics", item_name: ' + JSON.stringify(name) + ', column_values: ' + JSON.stringify(columnValues) + ') { id name } }';

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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Monday.com API error', details: result.errors })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        item_id: result.data && result.data.create_item && result.data.create_item.id
      })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
