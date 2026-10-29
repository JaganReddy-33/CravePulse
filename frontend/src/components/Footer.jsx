import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
export default function Footer() {
 return <footer className="bg-dark text-light mt-auto py-5"><div className="container"><div className="row g-4">
  <div className="col-12 col-lg-4"><BrandLogo /><p className="text-white-50 mt-3 small">Discover local kitchens, explore their menus and follow your order.</p></div>
  {[["Explore", [["/", "Restaurants"], ["/offers", "Current offers"], ["/cities", "Delivery areas"], ["/careers", "Careers"]]], ["Support", [["/help", "Help centre"], ["/contact", "Contact support"], ["/terms", "Terms"], ["/privacy", "Privacy"]]], ["Partners", [["/partner/login", "Kitchen login"], ["/partner/register", "Register a kitchen"], ["/rider/login", "Rider login"], ["/rider/register", "Apply to deliver"], ["/admin/login", "Administration"]]]].map(([title, links]) => <div className="col-6 col-md-4 col-lg" key={title}><h2 className="h6 text-white">{title}</h2><ul className="list-unstyled small mb-0">{links.map(([to, label]) => <li className="mb-2" key={to}><Link className="text-white-50 text-decoration-none" to={to}>{label}</Link></li>)}</ul></div>)}
 </div><p className="small text-white-50 border-top border-secondary pt-4 mt-4 mb-0">? {new Date().getFullYear()} CravePulse</p></div></footer>;
}
