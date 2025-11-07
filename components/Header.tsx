
import React from 'react';

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 mr-3 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a5 5 0 01-4.9-5.555 5 5 0 014.33-4.33A5 5 0 0114.555 12 5 5 0 019 17zM9 17a5 5 0 004.9 5.555 5 5 0 00-4.33-4.33A5 5 0 003.445 12 5 5 0 009 17z" clipRule="evenodd" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="text-center mb-10 md:mb-12">
      <div className="flex items-center justify-center mb-4">
        <BrainIcon />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-light">
          Gerador de Gatilhos Mentais
        </h1>
      </div>
      <p className="text-lg md:text-xl text-dark-text-secondary max-w-2xl mx-auto">
        Crie copys persuasivas com o poder da IA. Selecione um gatilho, informe seu produto e veja a mágica acontecer.
      </p>
    </header>
  );
};
