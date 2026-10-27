/**
 * CravePulse: Pan-India Multi-City & Locality Directory
 * Supporting major culinary metros and tier-1/tier-2 hubs with real coordinates.
 */

export const PAN_INDIA_CITIES = [
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    icon: '🏛️',
    hubs: [
      { id: 'blr_indiranagar', name: 'Indiranagar', area: '100ft Road / 12th Main', coords: [12.9783692, 77.6408356] },
      { id: 'blr_koramangala', name: 'Koramangala', area: '5th Block / Sony Signal', coords: [12.9352, 77.6245] },
      { id: 'blr_hsr', name: 'HSR Layout', area: 'Sector 1 / 27th Main', coords: [12.9121, 77.6446] },
      { id: 'blr_whitefield', name: 'Whitefield', area: 'ITPL Main Road', coords: [12.9698, 77.7500] },
      { id: 'blr_jayanagar', name: 'Jayanagar', area: '4th Block Complex', coords: [12.9308, 77.5838] },
      { id: 'blr_bellandur', name: 'Bellandur', area: 'Outer Ring Road Ecospace', coords: [12.9260, 77.6762] },
      { id: 'blr_mgroad', name: 'MG Road / Brigade', area: 'Church Street Junction', coords: [12.9756, 77.6066] }
    ]
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    icon: '🏰',
    hubs: [
      { id: 'hyd_jubilee', name: 'Jubilee Hills', area: 'Road No 36 & 45', coords: [17.4319, 78.4073] },
      { id: 'hyd_banjara', name: 'Banjara Hills', area: 'Road No 12 / Care Hospital', coords: [17.4156, 78.4354] },
      { id: 'hyd_gachibowli', name: 'Gachibowli', area: 'Financial District / DLF', coords: [17.4401, 78.3489] },
      { id: 'hyd_madhapur', name: 'Madhapur', area: 'Hitec City / Cyber Towers', coords: [17.4483, 78.3915] },
      { id: 'hyd_kondapur', name: 'Kondapur', area: 'RTO Office / Kothaguda', coords: [17.4699, 78.3578] },
      { id: 'hyd_kukatpally', name: 'Kukatpally', area: 'KPHB Colony Phase 1-6', coords: [17.4938, 78.3999] },
      { id: 'hyd_charminar', name: 'Old City / Charminar', area: 'Laad Bazaar / Nayab', coords: [17.3616, 78.4747] }
    ]
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    icon: '🌊',
    hubs: [
      { id: 'bom_bandra', name: 'Bandra West', area: 'Hill Road / Linking Road', coords: [19.0596, 72.8295] },
      { id: 'bom_andheri', name: 'Andheri West', area: 'Lokhandwala Complex', coords: [19.1363, 72.8277] },
      { id: 'bom_juhu', name: 'Juhu', area: 'Tara Road / Beach', coords: [19.1075, 72.8263] },
      { id: 'bom_powai', name: 'Powai', area: 'Hiranandani Gardens', coords: [19.1176, 72.9060] },
      { id: 'bom_lowerparel', name: 'Lower Parel', area: 'Phoenix Palladium / Kamala Mills', coords: [19.0016, 72.8277] },
      { id: 'bom_colaba', name: 'Colaba', area: 'Causeway / Gateway of India', coords: [18.9067, 72.8147] }
    ]
  },
  {
    id: 'delhi',
    name: 'Delhi-NCR',
    state: 'Delhi / Haryana',
    icon: '🕌',
    hubs: [
      { id: 'del_cp', name: 'Connaught Place', area: 'Inner Circle / Janpath', coords: [28.6304, 77.2177] },
      { id: 'del_gurgaon', name: 'Cyber Hub Gurgaon', area: 'DLF Cyber City Phase 2', coords: [28.4950, 77.0895] },
      { id: 'del_hauzkhas', name: 'Hauz Khas', area: 'HKV & Aurobindo Marg', coords: [28.5494, 77.2001] },
      { id: 'del_noida', name: 'Noida Sector 18', area: 'Atta Market / Mall of India', coords: [28.5708, 77.3261] },
      { id: 'del_southex', name: 'South Extension', area: 'Part 1 & 2 Market', coords: [28.5714, 77.2217] }
    ]
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    icon: '🛕',
    hubs: [
      { id: 'maa_tnagar', name: 'T. Nagar', area: 'Pondy Bazaar / Usman Road', coords: [13.0418, 80.2341] },
      { id: 'maa_annanagar', name: 'Anna Nagar', area: '2nd Avenue / Roundtana', coords: [13.0850, 80.2101] },
      { id: 'maa_adyar', name: 'Adyar', area: 'Gandhi Nagar / LB Road', coords: [13.0012, 80.2565] },
      { id: 'maa_velachery', name: 'Velachery', area: '100ft Bypass Road', coords: [12.9759, 80.2212] }
    ]
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    icon: '🏞️',
    hubs: [
      { id: 'pnq_kp', name: 'Koregaon Park', area: 'North Main Road', coords: [18.5362, 73.8940] },
      { id: 'pnq_vimannagar', name: 'Viman Nagar', area: 'Phoenix Marketcity', coords: [18.5679, 73.9143] },
      { id: 'pnq_baner', name: 'Baner & Balewadi', area: 'High Street / Pan Card Club Rd', coords: [18.5590, 73.7868] },
      { id: 'pnq_kothrud', name: 'Kothrud', area: 'Paud Road / Karve Statue', coords: [18.5074, 73.8077] }
    ]
  },
  {
    id: 'vizag',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    icon: '⚓',
    hubs: [
      { id: 'vt_mvp', name: 'MVP Colony', area: 'Sector 1-9 / AS Raja Grounds', coords: [17.7420, 83.3378] },
      { id: 'vt_siripuram', name: 'Siripuram', area: 'Dutt Island / VIP Road', coords: [17.7214, 83.3150] },
      { id: 'vt_rushikonda', name: 'Rushikonda', area: 'IT SEZ / Beach Road', coords: [17.7816, 83.3853] },
      { id: 'vt_gajuwaka', name: 'Gajuwaka', area: 'High School Road / Old Gajuwaka', coords: [17.6905, 83.2096] }
    ]
  },
  {
    id: 'vijayawada',
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    icon: '🌾',
    hubs: [
      { id: 'bza_benzcircle', name: 'Benz Circle', area: 'MG Road / Bandar Road', coords: [16.5008, 80.6480] },
      { id: 'bza_governorpet', name: 'Governorpet', area: 'Eluru Road / Besant Road', coords: [16.5165, 80.6275] },
      { id: 'bza_poranki', name: 'Poranki', area: 'Penamaluru / Bandar Road', coords: [16.4789, 80.6978] }
    ]
  }
];

export const DEFAULT_HUB = PAN_INDIA_CITIES[0].hubs[0]; // Indiranagar, Bengaluru
