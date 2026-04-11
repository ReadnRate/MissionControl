const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanLeads() {
  const { error } = await supabase
    .from('author_leads')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // deletes everything

  if (error) {
    console.log("Error deleting:", error.message);
  } else {
    console.log("Poubelle vidée : 5 fausses lignes supprimées.");
  }
}
cleanLeads();
