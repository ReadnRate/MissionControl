import sys
sys.path.insert(0, '/data/.openclaw/workspace/skills/n8n/scripts')
from n8n_api import N8nClient

client = N8nClient()

cities_js = """const cities = [
  {country: "US", city: "New York", keyword: "hair salon"},
  {country: "US", city: "Los Angeles", keyword: "hair salon"},
  {country: "US", city: "Chicago", keyword: "hair salon"},
  {country: "US", city: "Houston", keyword: "barber shop"},
  {country: "US", city: "Phoenix", keyword: "hair salon"},
  {country: "US", city: "Philadelphia", keyword: "barber shop"},
  {country: "US", city: "San Antonio", keyword: "hair salon"},
  {country: "US", city: "San Diego", keyword: "barber shop"},
  {country: "US", city: "Dallas", keyword: "hair salon"},
  {country: "US", city: "San Jose", keyword: "hair salon"},
  {country: "US", city: "Austin", keyword: "barber shop"},
  {country: "US", city: "Jacksonville", keyword: "hair salon"},
  {country: "US", city: "Fort Worth", keyword: "hair salon"},
  {country: "US", city: "Columbus", keyword: "barber shop"},
  {country: "US", city: "Charlotte", keyword: "hair salon"},
  {country: "US", city: "San Francisco", keyword: "hair salon"},
  {country: "US", city: "Indianapolis", keyword: "barber shop"},
  {country: "US", city: "Seattle", keyword: "hair salon"},
  {country: "US", city: "Denver", keyword: "barber shop"},
  {country: "US", city: "Washington", keyword: "hair salon"},
  {country: "US", city: "Boston", keyword: "hair salon"},
  {country: "US", city: "El Paso", keyword: "hair salon"},
  {country: "US", city: "Nashville", keyword: "barber shop"},
  {country: "US", city: "Detroit", keyword: "hair salon"},
  {country: "US", city: "Oklahoma City", keyword: "hair salon"},
  {country: "US", city: "Portland", keyword: "hair salon"},
  {country: "US", city: "Las Vegas", keyword: "hair salon"},
  {country: "US", city: "Memphis", keyword: "barber shop"},
  {country: "US", city: "Louisville", keyword: "hair salon"},
  {country: "US", city: "Baltimore", keyword: "hair salon"},
  {country: "US", city: "Milwaukee", keyword: "hair salon"},
  {country: "US", city: "Albuquerque", keyword: "hair salon"},
  {country: "US", city: "Tucson", keyword: "barber shop"},
  {country: "US", city: "Fresno", keyword: "hair salon"},
  {country: "US", city: "Sacramento", keyword: "hair salon"},
  {country: "US", city: "Kansas City", keyword: "hair salon"},
  {country: "US", city: "Atlanta", keyword: "hair salon"},
  {country: "US", city: "Miami", keyword: "hair salon"},
  {country: "US", city: "New Orleans", keyword: "hair salon"},
  {country: "CA", city: "Toronto", keyword: "hair salon"},
  {country: "CA", city: "Montreal", keyword: "salon de coiffure"},
  {country: "CA", city: "Vancouver", keyword: "hair salon"},
  {country: "CA", city: "Calgary", keyword: "barber shop"},
  {country: "CA", city: "Ottawa", keyword: "hair salon"},
  {country: "CA", city: "Edmonton", keyword: "hair salon"},
  {country: "CA", city: "Winnipeg", keyword: "hair salon"},
  {country: "CA", city: "Quebec City", keyword: "salon de coiffure"},
  {country: "CA", city: "Hamilton", keyword: "hair salon"},
  {country: "CA", city: "Kitchener", keyword: "hair salon"},
  {country: "CA", city: "London", keyword: "hair salon"},
  {country: "CA", city: "Victoria", keyword: "hair salon"},
  {country: "CA", city: "Halifax", keyword: "hair salon"},
  {country: "CA", city: "Oshawa", keyword: "hair salon"},
  {country: "CA", city: "Windsor", keyword: "hair salon"},
  {country: "CA", city: "Saskatoon", keyword: "hair salon"},
  {country: "CA", city: "Regina", keyword: "hair salon"},
  {country: "CA", city: "St. John's", keyword: "hair salon"},
  {country: "CA", city: "Barrie", keyword: "hair salon"},
  {country: "CA", city: "Kelowna", keyword: "hair salon"},
  {country: "MX", city: "Mexico City", keyword: "peluqueria"},
  {country: "MX", city: "Guadalajara", keyword: "peluqueria"},
  {country: "MX", city: "Monterrey", keyword: "peluqueria"},
  {country: "MX", city: "Puebla", keyword: "barberia"},
  {country: "MX", city: "Tijuana", keyword: "peluqueria"},
  {country: "MX", city: "Leon", keyword: "barberia"},
  {country: "MX", city: "Juarez", keyword: "peluqueria"},
  {country: "MX", city: "Zapopan", keyword: "peluqueria"},
  {country: "MX", city: "Merida", keyword: "peluqueria"},
  {country: "MX", city: "San Luis Potosi", keyword: "peluqueria"}
];
return cities.map(function(c) { return {json: c}; });"""

parse_js = """var csvText = $input.first().json;
var lines = csvText.split('\\n');
if (lines.length < 2) return [{json: {skip: true}}];
var headers = lines[0].split(',').map(function(h) { return h.trim().replace(/"/g, '').toLowerCase(); });

function getCol(values, name) {
  var idx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase() === name.toLowerCase()) { idx = i; break; }
  }
  if (idx < 0 || idx >= values.length) return null;
  var val = values[idx];
  if (!val) return null;
  val = val.trim().replace(/"/g, '');
  return val || null;
}

var city = $('Split in Batches').item.json.city;
var country = $('Split in Batches').item.json.country;
var keyword = $('Split in Batches').item.json.keyword;
var leads = [];

for (var i = 1; i < lines.length; i++) {
  var values = lines[i].split(',').map(function(v) { return v.trim().replace(/"/g, ''); });
  if (!values[0] || values[0].length < 2) continue;
  var email = getCol(values, 'Email') || getCol(values, 'Email 2') || getCol(values, 'Email 3');
  leads.push({json: {
    business_name: getCol(values, 'Name'),
    address: getCol(values, 'Full address'),
    phone: getCol(values, 'Phone'),
    website: getCol(values, 'Website'),
    email: email,
    city: getCol(values, 'City'),
    state: getCol(values, 'State'),
    country: getCol(values, 'Country code'),
    postal_code: getCol(values, 'Postal code'),
    keyword: keyword,
    source: 'scrapio',
    reviews_count: parseInt(getCol(values, 'Reviews count') || '0') || 0,
    reviews_rating: parseFloat(getCol(values, 'Reviews rating') || '0') || 0,
    instagram: getCol(values, 'Instagram link'),
    facebook: getCol(values, 'Facebook link'),
    is_claimed: getCol(values, 'Is claimed') === 'true',
    is_closed: getCol(values, 'Is closed permanently') === 'true',
    price_range: getCol(values, 'Price range simplified'),
    status: email ? 'new' : 'no_email'
  }});
}
return leads.length > 0 ? leads : [{json: {skip: true}}]; """

check_js = """var item = $input.first().json;
var exportId = item.export_id || item.id;
return [{json: {
  export_id: exportId,
  city: $('Split in Batches').item.json.city,
  country: $('Split in Batches').item.json.country,
  keyword: $('Split in Batches').item.json.keyword
}}]; """

insert_body = {
    "business_name": "={{ $json.business_name }}",
    "address": "={{ $json.address }}",
    "phone": "={{ $json.phone }}",
    "website": "={{ $json.website }}",
    "email": "={{ $json.email }}",
    "city": "={{ $json.city }}",
    "state": "={{ $json.state }}",
    "country": "={{ $json.country }}",
    "postal_code": "={{ $json.postal_code }}",
    "keyword": "={{ $json.keyword }}",
    "source": "={{ $json.source }}",
    "reviews_count": "={{ $json.reviews_count }}",
    "reviews_rating": "={{ $json.reviews_rating }}",
    "instagram": "={{ $json.instagram }}",
    "facebook": "={{ $json.facebook }}",
    "is_claimed": "={{ $json.is_claimed }}",
    "is_closed": "={{ $json.is_closed }}",
    "price_range": "={{ $json.price_range }}",
    "status": "={{ $json.status }}"
}

insert_headers = {
    "parameters": [
        {"name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}"},
        {"name": "Authorization", "value": "Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}"},
        {"name": "Content-Type", "value": "application/json"},
        {"name": "Prefer", "value": "return=minimal"}
    ]
}

nodes = [
    {"name": "Manual Trigger", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [100, 300], "parameters": {}},
    {"name": "Load Cities", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [300, 300], "parameters": {"jsCode": cities_js}},
    {"name": "Split in Batches", "type": "n8n-nodes-base.splitInBatches", "typeVersion": 3, "position": [500, 300], "parameters": {"batchSize": 1}},
    {"name": "Scrap.io Search", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [700, 300], "parameters": {"method": "POST", "url": "https://api.scrap.io/v1/search", "sendHeaders": True, "headerParameters": {"parameters": [{"name": "Authorization", "value": "Bearer {{ $env.SCRAPIO_API_KEY }}"}, {"name": "Content-Type", "value": "application/json"}]}, "sendBody": True, "bodyParameters": {"parameters": [{"name": "country", "value": "={{ $json.country }}"}, {"name": "city", "value": "={{ $json.city }}"}, {"name": "keyword", "value": "={{ $json.keyword }}"}]}}},
    {"name": "Wait for Export", "type": "n8n-nodes-base.wait", "typeVersion": 1.1, "position": [900, 300], "parameters": {"amount": 15, "unit": "seconds", "resume": "interval"}},
    {"name": "Check Export Status", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1100, 300], "parameters": {"jsCode": check_js}},
    {"name": "Download CSV", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1300, 300], "parameters": {"method": "GET", "url": "=https://api.scrap.io/v1/export/{{ $json.export_id }}/download", "sendHeaders": True, "headerParameters": {"parameters": [{"name": "Authorization", "value": "Bearer {{ $env.SCRAPIO_API_KEY }}"}]}, "options": {"response": {"response": {"responseFormat": "text"}}}}},
    {"name": "Parse CSV (90 cols)", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1500, 300], "parameters": {"jsCode": parse_js}},
    {"name": "Skip if Empty", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [1700, 300], "parameters": {"conditions": {"options": {"caseSensitive": True, "typeValidation": "strict"}, "conditions": [{"id": "skip", "leftValue": "={{ $json.skip }}", "rightValue": True, "operator": {"type": "boolean", "operation": "notExists"}}], "combinator": "and"}}},
    {"name": "Insert to Supabase", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1900, 200], "parameters": {"method": "POST", "url": "https://zexumnlvkrjryvzrlavp.supabase.co/rest/v1/trym_leads", "sendHeaders": True, "headerParameters": insert_headers, "sendBody": True, "specifyBody": "json", "body": insert_body}}
]

connections = {
    "Manual Trigger": {"main": [[{"node": "Load Cities", "type": "main"}]]},
    "Load Cities": {"main": [[{"node": "Split in Batches", "type": "main"}]]},
    "Split in Batches": {"main": [[{"node": "Scrap.io Search", "type": "main"}]]},
    "Scrap.io Search": {"main": [[{"node": "Wait for Export", "type": "main"}]]},
    "Wait for Export": {"main": [[{"node": "Check Export Status", "type": "main"}]]},
    "Check Export Status": {"main": [[{"node": "Download CSV", "type": "main"}]]},
    "Download CSV": {"main": [[{"node": "Parse CSV (90 cols)", "type": "main"}]]},
    "Parse CSV (90 cols)": {"main": [[{"node": "Skip if Empty", "type": "main"}]]},
    "Skip if Empty": {"main": [[{"node": "Insert to Supabase", "type": "main"}]]}
}

workflow = {
    "name": "Scrapio Trym Lead Gen",
    "nodes": nodes,
    "connections": connections,
    "settings": {"executionOrder": "v1"}
}

result = client.create_workflow(workflow)
print("DONE - ID:", result.get('id'))
