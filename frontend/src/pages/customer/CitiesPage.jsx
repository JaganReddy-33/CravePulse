import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CITIES = [
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    activeHubs: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar', 'Malleshwaram'],
    avgEta: '24 mins',
    partnerKitchens: 480,
    specialties: 'Masala Dosa, Filter Coffee, Donne Biryani, Craft Burgers',
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600',
    status: 'ACTIVE NOW'
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    activeHubs: ['Bandra West', 'Andheri Lokhandwala', 'Juhu', 'Colaba', 'Powai', 'Lower Parel'],
    avgEta: '28 mins',
    partnerKitchens: 620,
    specialties: 'Vada Pav, Coastal Seafood Curry, Parsi Berry Pulao, Frankie',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600',
    status: 'ACTIVE NOW'
  },
  {
    name: 'Delhi-NCR',
    state: 'Delhi / Haryana',
    activeHubs: ['Connaught Place', 'Cyber Hub Gurgaon', 'Hauz Khas', 'Defence Colony', 'Noida Sec 18'],
    avgEta: '26 mins',
    partnerKitchens: 750,
    specialties: 'Butter Chicken, Old Delhi Chaat, Chole Bhature, Tandoori Kebabs',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600',
    status: 'ACTIVE NOW'
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    activeHubs: ['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Madhapur', 'Charminar Old City'],
    avgEta: '22 mins',
    partnerKitchens: 510,
    specialties: 'Authentic Dum Biryani, Haleem, Mirchi Ka Salan, Double Ka Meetha',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600',
    status: 'ACTIVE NOW'
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    activeHubs: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Besant Nagar', 'Nungambakkam'],
    avgEta: '27 mins',
    partnerKitchens: 390,
    specialties: 'Chettinad Pepper Chicken, Ghee Roast, Kothu Parotta, Jigarthanda',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600',
    status: 'ACTIVE NOW'
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    activeHubs: ['Koregaon Park', 'Kothrud', 'Viman Nagar', 'Baner', 'Aundh'],
    avgEta: '25 mins',
    partnerKitchens: 340,
    specialties: 'Misal Pav, Bakarwadi, Kolhapuri Mutton Thali, Puran Poli',
    image: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=600',
    status: 'ACTIVE NOW'
  }
];

const CitiesPage = () => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill fw-bold mb-2">
          🗺️ PAN-INDIA DELIVERY NETWORK
        </span>
        <h1 className="fw-extrabold text-dark display-6 mb-2">CravePulse Delivery Cities</h1>
        <p className="text-muted lead mx-auto" style={{ maxWidth: 640 }}>
          Operating hyper-local delivery grids across India's culinary epicenters with zero markup pricing.
        </p>
      </div>

      {/* Cities Grid */}
      <div className="row g-4 mb-5">
        {CITIES.map((city) => (
          <div key={city.name} className="col-md-6 col-lg-4">
            <div 
              className={`card border-0 rounded-4 shadow-sm overflow-hidden h-100 bg-white transition hover-lift ${selectedCity.name === city.name ? 'border border-primary' : ''}`}
              onClick={() => setSelectedCity(city)}
              style={{ cursor: 'pointer' }}
            >
              <div className="position-relative" style={{ height: 180 }}>
                <img src={city.image} alt={city.name} className="w-100 h-100 object-fit-cover" />
                <span className="badge bg-success position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill">
                  {city.status}
                </span>
                <span className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-3 px-2 py-1 rounded">
                  Avg ETA: {city.avgEta}
                </span>
              </div>

              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <h4 className="fw-extrabold text-dark mb-0">{city.name}</h4>
                  <small className="text-muted">{city.state}</small>
                </div>
                <div className="small text-primary fw-semibold mb-3">
                  {city.partnerKitchens}+ Verified Restaurants
                </div>

                <div className="mb-3">
                  <span className="text-muted small d-block mb-1 fw-bold">Popular Hubs:</span>
                  <div className="d-flex flex-wrap gap-1">
                    {city.activeHubs.slice(0, 4).map((hub, idx) => (
                      <span key={idx} className="badge bg-light text-dark border small">
                        {hub}
                      </span>
                    ))}
                    {city.activeHubs.length > 4 && (
                      <span className="badge bg-light text-muted border small">+{city.activeHubs.length - 4} more</span>
                    )}
                  </div>
                </div>

                <div className="small text-muted mb-4">
                  <strong className="text-dark">Iconic Dishes:</strong> {city.specialties}
                </div>

                <Link
                  to="/"
                  className="btn btn-outline-primary w-100 rounded-pill btn-sm fw-bold"
                >
                  Order in {city.name} →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* City Expansion Box */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white text-center">
        <h4 className="fw-bold text-dark mb-2">Want CravePulse in your city?</h4>
        <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: 540 }}>
          We are launching Kolkata, Ahmedabad, Chandigarh, and Kochi next month. Vote for your city or register your restaurant to be first in line!
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/contact" className="btn btn-primary rounded-pill px-4 btn-sm fw-bold" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
            Vote for My City
          </Link>
          <Link to="/partner/register" className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold">
            Register Restaurant in New City
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CitiesPage;
