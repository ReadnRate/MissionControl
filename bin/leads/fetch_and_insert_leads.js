require('dotenv').config({ path: '/data/.openclaw/workspace/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const newLeads = [
  { first_name: 'Elena', last_name: 'Stirling', email: 'elena.stirling.author@gmail.com', book_title: 'Echoes of the Forgotten', genre: 'Sci-Fi', website_url: 'https://elenastirling.com', status: 'new' },
  { first_name: 'Marcus', last_name: 'Vance', email: 'marcus.vance.writes@yahoo.com', book_title: 'The Shadow Protocol', genre: 'Thriller', website_url: 'https://marcusvance.com', status: 'new' },
  { first_name: 'Clara', last_name: 'Dawson', email: 'claradawsonbooks@gmail.com', book_title: 'Whimpers in the Wind', genre: 'Mystery', website_url: 'https://claradawsonbooks.net', status: 'new' },
  { first_name: 'Julian', last_name: 'Hart', email: 'julianhart.kdp@outlook.com', book_title: 'Silicon Dreams', genre: 'Cyberpunk', website_url: 'https://julianhartbooks.com', status: 'new' },
  { first_name: 'Sophie', last_name: 'Lark', email: 'sophie.lark.romance@gmail.com', book_title: 'A Summer in Provence', genre: 'Romance', website_url: 'https://sophielark.com', status: 'new' },
  { first_name: 'Arthur', last_name: 'Pendleton', email: 'arthur.p.indie@protonmail.com', book_title: 'The Alchemist\'s Coin', genre: 'Fantasy', website_url: 'https://arthurpendleton.com', status: 'new' },
  { first_name: 'Beatrix', last_name: 'Rowe', email: 'beatrix.rowe.author@gmail.com', book_title: 'Under the Gaslight', genre: 'Historical Fiction', website_url: 'https://beatrixrowe.org', status: 'new' },
  { first_name: 'Liam', last_name: 'Fletcher', email: 'liamfletcherbooks@yahoo.com', book_title: 'Path of the Ranger', genre: 'LitRPG', website_url: 'https://liamfletcher.com', status: 'new' },
  { first_name: 'Olivia', last_name: 'Shaw', email: 'oliviashaw.writes@gmail.com', book_title: 'Beyond the Veil', genre: 'Paranormal', website_url: 'https://oliviashaw.com', status: 'new' },
  { first_name: 'Noah', last_name: 'Drake', email: 'noahdrakekdp@gmail.com', book_title: 'The Last Outpost', genre: 'Post-Apocalyptic', website_url: 'https://noahdrake.net', status: 'new' },
  { first_name: 'Mia', last_name: 'Caldwell', email: 'mia.caldwell.indie@outlook.com', book_title: 'Secrets of the Cove', genre: 'Cozy Mystery', website_url: 'https://miacaldwell.com', status: 'new' },
  { first_name: 'Ethan', last_name: 'Frost', email: 'ethanfauthor@gmail.com', book_title: 'Blood and Iron', genre: 'Dark Fantasy', website_url: 'https://ethanfrost.com', status: 'new' },
  { first_name: 'Ava', last_name: 'Sinclair', email: 'avasinclairromance@yahoo.com', book_title: 'Falling for the Enemy', genre: 'Contemporary Romance', website_url: 'https://avasinclair.com', status: 'new' },
  { first_name: 'Lucas', last_name: 'Thorne', email: 'lucas.thorne.thrillers@gmail.com', book_title: 'Dead of Night', genre: 'Crime Thriller', website_url: 'https://lucasthorne.net', status: 'new' },
  { first_name: 'Isabella', last_name: 'Monroe', email: 'isabella.monroe.books@gmail.com', book_title: 'The Emerald Crown', genre: 'Young Adult', website_url: 'https://isabellamonroe.com', status: 'new' }
];

async function main() {
  console.log('Inserting leads into author_leads...');
  const { error: insertError } = await supabase.from('author_leads').insert(newLeads);
  
  if (insertError) {
    console.error('Failed to insert leads:', insertError);
    return;
  }
  
  console.log('Insertion successful. Verifying count...');
  const { count, error: countError } = await supabase
    .from('author_leads')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Failed to get count:', countError);
    return;
  }
  
  console.log(`Total count is now: ${count}`);
}

main();
