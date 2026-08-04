// Netlify Serverless Function: submit-appointment.js
// Posts to TWO Monday.com boards on every website form submission:
//   1. "Website Form Submissions" (ID: 18423966879) — tracking/archive
//   2. "Request An Appointment"   (ID: 4546344839)  — active sales pipeline
//
// Required environment variable in Netlify:
//   MONDAY_API_TOKEN  — your Monday.com API v2 token

const MONDAY_API = 'https://api.monday.com/v2';
const MONDAY_HEADERS = () => ({
  'Content-Type': 'application/json',
  'Authorization': process.env.MONDAY_API_TOKEN,
  'API-Version': '2024-01'
});

async function createMondayItem(boardId, groupId, itemName, columnValues) {
  const mutation = `
    mutation {
      create_item(
        board_id: ${boardId},
        group_id: "${groupId}",
        item_name: ${JSON.stringify(itemName)},
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
        name
      }
    }
  `;

  const response = await fetch(MONDAY_API, {
    method: 'POST',
    headers: MONDAY_HEADERS(),
    body: JSON.stringify({ query: mutation })
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`Monday API error (board ${boardId}): ${JSON.stringify(result.errors)}`);
  }
  return result.data.create_item;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, phone, email, zip, service, financing, message, city } = data;

    if (!name || !phone || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name, phone, and email are required.' })
      };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const itemName = city ? `${name} — ${city}` : name;
    const submittedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ── Board 1: Website Form Submissions (archive/tracking) ──────────────────
    const submissionsColumns = {
      phone_mm5npava:     { phone: cleanPhone, countryShortName: 'US' },
      email_mm5nxjdw:     { email: email, text: email },
      text_mm5nx4aj:      service   || '',
      text_mm5ne5cy:      financing || '',
      text_mm5nf7cj:      zip || city || '',
      long_text_mm5nzxkg: { text: message || '' },
      date_mm5w1cqp:      { date: submittedDate }
    };

    // ── Board 2: Request An Appointment (active pipeline) ─────────────────────
    // label1 id 12 = "Website"  |  status id 5 = "NEW"
    const appointmentColumns = {
      phone7:              { phone: cleanPhone, countryShortName: 'US' },
      email:               { email: email, text: email },
      text_mm5pqa4p:       zip || city || '',
      long_text_mm5pqrpc:  { text: message || '' },
      text_mm5pzf7y:       financing || '',
      text_1:              service   || '',   // "Is there anything else..." — carries Service Interest
      label1:              { index: 12 },     // How did you hear about us? → Website
      status:              { index: 5  }      // Status → NEW
    };

    // Fire both requests in parallel
    const [submissionsItem, appointmentItem] = await Promise.all([
      createMondayItem(
        18423966879,
        'topics',
        itemName,
        submissionsColumns
      ),
      createMondayItem(
        4546344839,
        'duplicate_of_new_calls38643', // "New Calls" group
        itemName,
        appointmentColumns
      )
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        submissions_item_id:  submissionsItem.id,
        appointment_item_id:  appointmentItem.id
      })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
