// One-time setup function — visit /.netlify/functions/setup-monday-columns once,
// copy the date column ID from the response, then delete this file.

exports.handler = async () => {
  const BOARD_ID = 18423966879;

  // Step 1: create the date column
  const createMutation = `
    mutation {
      create_column(
        board_id: ${BOARD_ID},
        title: "Submitted On",
        column_type: date
      ) { id title }
    }
  `;

  const createRes = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.MONDAY_API_TOKEN,
      'API-Version': '2024-01'
    },
    body: JSON.stringify({ query: createMutation })
  });

  const createData = await createRes.json();

  // Step 2: list all columns so we can confirm IDs
  const listQuery = `
    query {
      boards(ids: [${BOARD_ID}]) {
        columns { id title type }
      }
    }
  `;

  const listRes = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.MONDAY_API_TOKEN,
      'API-Version': '2024-01'
    },
    body: JSON.stringify({ query: listQuery })
  });

  const listData = await listRes.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      created: createData,
      all_columns: listData?.data?.boards?.[0]?.columns || []
    }, null, 2)
  };
};
