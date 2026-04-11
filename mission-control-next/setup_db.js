const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zexumnlvkrjryvzrlavp:MissionControl2026!@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to DB.");

  try {
    // Task 1: Create table scrapio_cities
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scrapio_cities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        state TEXT,
        country TEXT NOT NULL CHECK (country IN ('US', 'CA', 'MX')),
        population INTEGER,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
        keywords_completed TEXT[] DEFAULT '{}',
        run_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(city, state, country)
      );
    `;
    await client.query(createTableQuery);
    console.log("Table scrapio_cities created or updated.");

    // Update scrapio_runs table (unique constraint)
    // Check if table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scrapio_runs'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      try {
        await client.query(`ALTER TABLE scrapio_runs ADD CONSTRAINT scrapio_runs_city_keyword_key UNIQUE (city, keyword);`);
        console.log("Added unique constraint to scrapio_runs.");
      } catch (err) {
        if (err.code !== '42P07') { // relation already exists
          console.error("Error adding constraint (might already exist):", err.message);
        } else {
          console.log("Unique constraint already exists on scrapio_runs.");
        }
      }
    } else {
      console.log("Table scrapio_runs does not exist, skipping constraint.");
    }
    
    // Task 2: Insert data
    const usCities = [
      "New York|NY|US|8336817", "Los Angeles|CA|US|3822238", "Chicago|IL|US|2665039", "Houston|TX|US|2302878", "Phoenix|AZ|US|1644409",
      "Philadelphia|PA|US|1567258", "San Antonio|TX|US|1472909", "San Diego|CA|US|1381162", "Dallas|TX|US|1300092", "San Jose|CA|US|971233",
      "Austin|TX|US|974447", "Jacksonville|FL|US|971319", "Fort Worth|TX|US|956709", "Columbus|OH|US|907971", "Indianapolis|IN|US|880621",
      "Charlotte|NC|US|897720", "San Francisco|CA|US|808437", "Seattle|WA|US|749256", "Denver|CO|US|713252", "Washington|DC|US|678972",
      "Boston|MA|US|650706", "El Paso|TX|US|677456", "Nashville|TN|US|683622", "Detroit|MI|US|620376", "Oklahoma City|OK|US|694800",
      "Portland|OR|US|635067", "Las Vegas|NV|US|656274", "Memphis|TN|US|621056", "Louisville|KY|US|624444", "Baltimore|MD|US|569931",
      "Milwaukee|WI|US|563305", "Albuquerque|NM|US|561008", "Tucson|AZ|US|546574", "Fresno|CA|US|545567", "Sacramento|CA|US|528001",
      "Kansas City|MO|US|509297", "Atlanta|GA|US|499127", "Miami|FL|US|449514", "Colorado Springs|CO|US|486248", "Raleigh|NC|US|476587",
      "Omaha|NE|US|485153", "Long Beach|CA|US|451307", "Virginia Beach|VA|US|455618", "Oakland|CA|US|430553", "Minneapolis|MN|US|425096",
      "Tampa|FL|US|398173", "Tulsa|OK|US|411867", "Arlington|TX|US|394266", "New Orleans|LA|US|369749", "Wichita|KS|US|396119",
      "Cleveland|OH|US|361607", "Bakersfield|CA|US|410647", "Amarillo|TX|US|201234", "Anaheim|CA|US|341245", "Honolulu|HI|US|343414",
      "Santa Ana|CA|US|309441", "Riverside|CA|US|317261", "Corpus Christi|TX|US|316239", "Lexington|KY|US|321959", "Stockton|CA|US|322120",
      "Henderson|NV|US|331415", "Saint Paul|MN|US|303176", "Newark|NJ|US|305344", "Cincinnati|OH|US|309513", "St. Petersburg|FL|US|261338",
      "Sandy Springs|GA|US|106753", "Jersey City|NJ|US|286670", "Greensboro|NC|US|301115", "Plano|TX|US|289577", "Buffalo|NY|US|276486",
      "Lincoln|NE|US|292657", "Gilroy|CA|US|58765", "Orlando|FL|US|316081", "Chula Vista|CA|US|277220", "Pittsburgh|PA|US|302898",
      "St. Louis|MO|US|286578", "Norfolk|VA|US|235089", "Chandler|AZ|US|280711", "Madison|WI|US|272903", "Garland|TX|US|242035",
      "Reno|NV|US|268851", "Hialeah|FL|US|220490", "Lubbock|TX|US|260993", "Irving|TX|US|254198", "Scottsdale|AZ|US|243050",
      "Laredo|TX|US|256153", "Jacksonville|NC|US|72447", "Durham|NC|US|287865", "Winston-Salem|NC|US|250320", "Gig Harbor|WA|US|12028",
      "Lakeland|FL|US|115425", "Glendale|AZ|US|250702", "Beaumont|TX|US|112556", "Salem|OR|US|177723", "Chesterfield|VA|US|364000",
      "Hayward|CA|US|159827", "Manchester|NH|US|115462", "McAllen|TX|US|144579", "Carrollton|TX|US|133251"
    ];

    const caCities = [
      "Toronto|ON|CA|2794356", "Montreal|QC|CA|1762949", "Vancouver|BC|CA|662248", "Calgary|AB|CA|1306784", "Edmonton|AB|CA|1010899",
      "Ottawa|ON|CA|1017449", "Winnipeg|MB|CA|749607", "Quebec City|QC|CA|549459", "Hamilton|ON|CA|569353", "Kitchener|ON|CA|256885",
      "London|ON|CA|422324", "Victoria|BC|CA|91867", "Halifax|NS|CA|439819", "Oshawa|ON|CA|175383", "Windsor|ON|CA|229660",
      "Saskatoon|SK|CA|266141", "Regina|SK|CA|226404", "St. John's|NL|CA|110525", "Barrie|ON|CA|147829", "Kelowna|BC|CA|144576",
      "Abbotsford|BC|CA|153524", "Sherbrooke|QC|CA|172950", "Trois-Rivières|QC|CA|139163", "Guelph|ON|CA|143740", "Moncton|NB|CA|79470",
      "Thunder Bay|ON|CA|108843", "Saint John|NB|CA|69895", "Nanaimo|BC|CA|99863", "Sudbury|ON|CA|166004", "Brantford|ON|CA|104688",
      "Peterborough|ON|CA|83651", "Red Deer|AB|CA|100844", "Lethbridge|AB|CA|98406", "Kamloops|BC|CA|97902", "Belleville|ON|CA|55071",
      "Prince George|BC|CA|76708", "Medicine Hat|AB|CA|63271", "Drummondville|QC|CA|79258", "Northumberland County|ON|CA|85598", "Chilliwack|BC|CA|93203",
      "Cornwall|ON|CA|47845", "Brockville|ON|CA|21346", "Vernon|BC|CA|43011", "Lincoln|ON|CA|24967", "Salisbury|NB|CA|3388",
      "Quinte West|ON|CA|46560", "Hawkesbury|ON|CA|10263", "Estevan|SK|CA|10851", "Weyburn|SK|CA|11019", "Swift Current|SK|CA|16750",
      "North Battleford|SK|CA|13836", "Yorkton|SK|CA|16280", "Kenora|ON|CA|14966", "Elliot Lake|ON|CA|11372", "Owen Sound|ON|CA|21612",
      "Stratford|ON|CA|33232", "Niagara Falls|ON|CA|94415", "Sault Ste. Marie|ON|CA|72051", "St. Catharines|ON|CA|136803", "Welland|ON|CA|55750",
      "North Bay|ON|CA|52662", "Timmins|ON|CA|41145", "Orillia|ON|CA|33411", "Penetanguishene|ON|CA|9186", "Chapleau|ON|CA|1942",
      "Moosonee|ON|CA|1346", "Parry Sound|ON|CA|6879", "Atikokan|ON|CA|2642", "Ignace|ON|CA|1202", "Pickle Lake|ON|CA|398",
      "Ear Falls|ON|CA|955", "Armstrong|ON|CA|100", "Deline|NT|CA|533", "Fort Resolution|NT|CA|470", "Fort Smith|NT|CA|2248",
      "Hay River|NT|CA|3169", "Inuvik|NT|CA|3137", "Norman Wells|NT|CA|673", "Tsiigehtchic|NT|CA|216", "Tuktoyaktuk|NT|CA|937",
      "Ulukhaktok|NT|CA|408", "Baker Lake|NU|CA|2069", "Cambridge Bay|NU|CA|1766", "Cape Dorset|NU|CA|1441", "Chesterfield Inlet|NU|CA|437",
      "Clyde River|NU|CA|1053", "Coral Harbour|NU|CA|891", "Gjoa Haven|NU|CA|1324", "Grise Fiord|NU|CA|129", "Hall Beach|NU|CA|848",
      "Igloolik|NU|CA|1744", "Iqaluit|NU|CA|7429", "Kimmirut|NU|CA|389", "Kugluktuk|NU|CA|1491", "Pangnirtung|NU|CA|1481",
      "Qikiqtarjuaq|NU|CA|593", "Rankin Inlet|NU|CA|2842", "Resolute|NU|CA|198", "Sanikiluaq|NU|CA|882", "Arviat|NU|CA|2657",
      "Brandon|MB|CA|51313", "Steinbach|MB|CA|17806", "Altona|MB|CA|4212", "Morden|MB|CA|9929", "Winkler|MB|CA|13745",
      "Dieppe|NB|CA|28114", "Edmundston|NB|CA|16437", "Fredericton|NB|CA|63116", "Miramichi|NB|CA|17692", "Bathurst|NB|CA|12157"
    ];

    const mxCities = [
      "Mexico City|CMX|MX|9209944", "Tijuana|BC|MX|1922523", "Ecatepec de Morelos|MEX|MX|1645352", "León|GUA|MX|1579803", "Puebla|PUE|MX|1542232",
      "Ciudad Juárez|CHH|MX|1501551", "Guadalajara|JAL|MX|1385629", "Zapopan|JAL|MX|1476491", "Mérida|YUC|MX|921771", "San Luis Potosí|SLP|MX|824229",
      "Aguascalientes|AGU|MX|866045", "Hermosillo|SON|MX|855562", "Saltillo|COA|MX|864431", "Mexicali|BC|MX|854186", "Culiacán|SIN|MX|808416",
      "Torreón|COA|MX|720848", "Monterrey|NLE|MX|1142994", "Nezahualcóyotl|MEX|MX|1077208", "Toluca|MEX|MX|910608", "Durango|DUR|MX|688697",
      "Veracruz|VER|MX|607209", "Mazatlán|SIN|MX|501441", "Cuautitlán Izcalli|MEX|MX|555163", "Apodaca|NLE|MX|656464", "Pachuca|HID|MX|314331",
      "Tampico|TAM|MX|315181", "Ensenada|BC|MX|443807", "Zacatecas|ZAC|MX|149607", "Cuernavaca|MOR|MX|378476", "Reynosa|TAM|MX|704767",
      "Benito Juárez|ROO|MX|911503", "Tonalá|JAL|MX|569913", "Los Reyes|MIC|MX|78935", "Salamanca|GUA|MX|273417", "Cabo San Lucas|BCS|MX|202694",
      "Compostela|NAY|MX|77436", "Silao|GUA|MX|203556", "San Nicolás de los Garza|NLE|MX|412199", "Guadalupe|NLE|MX|643143", "Oaxaca|OAX|MX|270955",
      "Uruapan|MIC|MX|356786", "Celaya|GUA|MX|521169", "Puerto Vallarta|JAL|MX|290459", "Chetumal|ROO|MX|169028", "Coatzacoalcos|VER|MX|310698",
      "San Juan del Río|QUE|MX|297804", "Córdoba|VER|MX|204721", "Zacatelco|TLA|MX|45717", "Lagos de Moreno|JAL|MX|172403", "Colima|COL|MX|157048",
      "Manzanillo|COL|MX|191031", "Guaymas|SON|MX|156863", "Guasave|SIN|MX|289370", "Texcoco|MEX|MX|277562", "Tlajomulco de Zúñiga|JAL|MX|727750",
      "Cholula|PUE|MX|138433", "Nuevo Laredo|TAM|MX|425058", "San José del Cabo|BCS|MX|136285", "Playa del Carmen|ROO|MX|333800", "Chilpancingo|GRO|MX|283354",
      "Alvarado|VER|MX|57021", "Tulum|ROO|MX|46721", "San Marcos|GRO|MX|50124", "Boca del Río|VER|MX|144826", "Altotonga|VER|MX|64234",
      "Nogales|SON|MX|261137", "Piedras Negras|COA|MX|176323", "Acuña|COA|MX|163058", "Perote|VER|MX|77432", "Martinez de la Torre|VER|MX|108825",
      "Poza Rica|VER|MX|189457", "Tuxpan|VER|MX|154600", "Tantoyuca|VER|MX|99959", "Pánuco|VER|MX|96185", "Tamazunchale|SLP|MX|96820",
      "Huauchinango|PUE|MX|103946", "Acatzingo|PUE|MX|63743", "Teziutlán|PUE|MX|103583", "Xiutetelco|PUE|MX|40922", "Huamantla|TLA|MX|98764",
      "Calpulalpan|TLA|MX|51172", "Apizaco|TLA|MX|80725", "Tlaxcala|TLA|MX|99896", "Chiautempan|TLA|MX|73215", "Contla|TLA|MX|38579",
      "Yauhquemehcan|TLA|MX|42619", "Papalotla|TLA|MX|33499", "Xicohtzinco|TLA|MX|14197", "Iztapaluca|MEX|MX|542211", "Valle de Chalco|MEX|MX|391731",
      "La Paz|BCS|MX|292241", "Tultitlán|MEX|MX|516341", "Tultepec|MEX|MX|159647", "Coacalco|MEX|MX|293444", "Lerdo|DUR|MX|163313",
      "Tehuacán|PUE|MX|327312", "Monclova|COA|MX|237951", "Navojoa|SON|MX|164387", "Gómez Palacio|DUR|MX|372750", "Ciudad Obregón|SON|MX|318184"
    ];

    const allCities = [...usCities, ...caCities, ...mxCities];

    console.log(`Inserting ${allCities.length} cities...`);
    let count = 0;
    for (const entry of allCities) {
      const parts = entry.split('|');
      const city = parts[0];
      const state = parts.length > 2 ? parts[1] : null;
      const country = parts[parts.length - 2];
      const pop = parts[parts.length - 1];

      try {
        await client.query(
          `INSERT INTO scrapio_cities (city, state, country, population)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (city, state, country) DO NOTHING;`,
          [city, state, country, parseInt(pop, 10)]
        );
        count++;
      } catch (err) {
        console.error(`Error inserting ${city}, ${state}:`, err.message);
      }
    }
    console.log(`Successfully processed ${count} cities.`);
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await client.end();
  }
}

run();
