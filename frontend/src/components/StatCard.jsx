import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass = "text-cyan border-cyan/20 bg-cyan/5" }) => {
  return (
    <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-muted/50 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtext mb-1">{title}</p>
          <h3 className="font-display font-bold text-3xl text-text leading-tight group-hover:text-cyan transition-colors">
            {value}
          </h3>
          {subtext && <p className="text-xs text-subtext mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${colorClass}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default StatCard;
