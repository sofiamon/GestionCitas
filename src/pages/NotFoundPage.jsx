import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Home } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
      <HeartPulse size={28} className="text-white" />
    </div>
    <p className="text-8xl font-extrabold text-gray-100 leading-none mb-2 select-none">404</p>
    <h1 className="text-2xl font-bold text-gray-800 mb-2">Página no encontrada</h1>
    <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
      La página que buscas no existe o fue movida a otra dirección.
    </p>
    <Link
      to="/"
      className="inline-flex items-center gap-2 gradient-primary text-white font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-transform duration-200 shadow-md"
    >
      <Home size={18} />
      Volver al inicio
    </Link>
  </div>
);

export default NotFoundPage;
